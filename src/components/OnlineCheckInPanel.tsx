"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  confirmOnlineCheckInAction,
  previewOnlineCheckInAction,
  type OnlineCheckInState,
} from "@/app/actions/supabase-checkin";
import { centsToCny } from "@/lib/money";

const initialState: OnlineCheckInState = {};

export function OnlineCheckInPanel() {
  const [previewState, previewAction, previewPending] = useActionState(
    previewOnlineCheckInAction,
    initialState
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmOnlineCheckInAction,
    initialState
  );
  const [token, setToken] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function startScan() {
    setScanError("");
    if (!("BarcodeDetector" in window)) {
      setScanError("此浏览器不支持摄像头扫码，请使用手机相机扫描后粘贴票号。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      // @ts-expect-error BarcodeDetector is not included in every TypeScript DOM library
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setToken(codes[0].rawValue);
            stopScan();
            return;
          }
        } catch {
          setScanError("二维码识别失败，请调整画面或手动输入票号。");
          stopScan();
          return;
        }
        if (streamRef.current) requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch {
      setScanError("无法打开摄像头，请检查浏览器权限或手动输入票号。");
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  const preview = previewState.preview;
  const result = confirmState.result;

  return (
    <div className="grid">
      <article className="panel">
        <h2>扫描电子票</h2>
        <form action={previewAction} className="form">
          <label>
            电子票二维码或票号
            <input
              name="token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="可打开摄像头扫描，或粘贴二维码内容/票号"
              required
            />
          </label>
          <div className="row">
            <button className="btn" type="submit" disabled={previewPending || !token}>
              {previewPending ? "查询中…" : "查询票面"}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={scanning ? stopScan : startScan}
            >
              {scanning ? "关闭摄像头" : "打开摄像头扫码"}
            </button>
          </div>
          {scanError && <p className="error" role="alert">{scanError}</p>}
          {previewState.error && <p className="error" role="alert">{previewState.error}</p>}
          {scanning && (
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", background: "#000" }}
            />
          )}
        </form>
      </article>

      {preview && (
        <article className="panel">
          <h2>核对并确认核销</h2>
          <div className="meta">
            <span>{preview.buyerName} · {preview.phone}</span>
            <span>{preview.showTitle}</span>
            <span>票号 {preview.ticketCode} · 本单共 {preview.quantity} 张</span>
            <span className="price">每张按金 {centsToCny(preview.depositCents)}</span>
            {preview.alreadyCheckedIn && <span className="badge warn">这张票已核销</span>}
            {preview.alreadyRefunded && <span className="badge warn">按金已登记退还</span>}
          </div>
          <p className="muted" style={{ marginTop: "0.8rem" }}>
            请先在现场完成签到和按金退还，再确认登记。系统不会自动转账退款，并会记录当前管理员账号。
          </p>
          <form action={confirmAction} className="form">
            <input type="hidden" name="token" value={preview.token} />
            <button className="btn" type="submit" disabled={confirmPending}>
              {confirmPending ? "处理中…" : "确认已核销并退还按金"}
            </button>
          </form>
          {confirmState.error && <p className="error" role="alert">{confirmState.error}</p>}
        </article>
      )}

      {result && (
        <div className="success" role="status">
          {result.alreadyCheckedIn && result.alreadyRefunded
            ? `这张票此前已处理：${result.ticketCode}。`
            : `已处理 ${result.ticketCode}（${result.buyerName}），登记退还按金 ${centsToCny(result.depositCents)}。`}
        </div>
      )}
    </div>
  );
}
