"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  confirmCheckInAction,
  previewCheckInAction,
  type CheckInState,
} from "@/app/actions/checkin";

const initial: CheckInState = {};

export function CheckInPanel() {
  const [previewState, previewAction, previewPending] = useActionState(
    previewCheckInAction,
    initial
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmCheckInAction,
    initial
  );
  const [token, setToken] = useState("");
  const [scanError, setScanError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startScan() {
    setScanError("");
    if (!("BarcodeDetector" in window)) {
      setScanError("此浏览器不支持摄像头扫码，请手动粘贴二维码内容或票号。");
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
      // @ts-expect-error BarcodeDetector is not in all TS libs
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setToken(codes[0].rawValue);
            stopScan();
            return;
          }
        } catch {
          // keep scanning
        }
        if (streamRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setScanError("无法打开摄像头，请改用手动输入。");
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  const preview = previewState.preview;
  const result = confirmState.result;

  return (
    <div className="grid">
      <article className="card">
        <h2>扫码 / 输入票券</h2>
        <div className="form">
          <label>
            二维码内容或票号（T-开头）
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="扫描后自动填入，或手动粘贴"
            />
          </label>
          <div className="row">
            <form action={previewAction}>
              <input type="hidden" name="token" value={token} />
              <button className="btn" type="submit" disabled={previewPending || !token}>
                {previewPending ? "查询中…" : "查询票面"}
              </button>
            </form>
            {!scanning ? (
              <button className="btn secondary" type="button" onClick={startScan}>
                打开摄像头扫码
              </button>
            ) : (
              <button className="btn secondary" type="button" onClick={stopScan}>
                关闭摄像头
              </button>
            )}
          </div>
          {scanError && <div className="error">{scanError}</div>}
          {previewState.error && <div className="error">{previewState.error}</div>}
          {scanning && (
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", borderRadius: 12, background: "#000" }}
            />
          )}
        </div>
      </article>

      {preview && (
        <article className="card">
          <h2>核销确认</h2>
          <div className="meta">
            <span>
              {preview.buyerName} · {preview.phone}
            </span>
            <span>{preview.showTitle}</span>
            <span>
              票号 {preview.ticketCode} · 本单共 {preview.quantity} 张
            </span>
            <span className="price">应退按金 {preview.depositLabel}</span>
            {preview.alreadyCheckedIn && <span className="badge warn">此票已核销过</span>}
            {preview.alreadyRefunded && <span className="badge warn">按金已登记退还</span>}
          </div>
          <form action={confirmAction} className="form" style={{ marginTop: "1rem" }}>
            <input type="hidden" name="token" value={preview.token} />
            <label>
              操作人（可选）
              <input name="refundedBy" placeholder="例如 门口-阿明" defaultValue="door-staff" />
            </label>
            <button className="btn" type="submit" disabled={confirmPending}>
              {confirmPending ? "处理中…" : "已核销并退按金"}
            </button>
          </form>
          {confirmState.error && <div className="error">{confirmState.error}</div>}
        </article>
      )}

      {result && (
        <div className="success">
          已处理 {result.ticketCode}（{result.buyerName}），退还 {result.depositLabel}。订单状态：
          {result.orderStatus}
        </div>
      )}
    </div>
  );
}
