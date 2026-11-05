"use client";

import { useActionState, useState } from "react";
import { markPaidAction, type ActionState } from "@/app/actions/orders";
import { BusyButton } from "@/components/BusyButton";

const initial: ActionState = {};

export function MarkPaidForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(markPaidAction, initial);
  const [fileName, setFileName] = useState("");

  return (
    <form action={action} className="form mark-paid-form" aria-busy={pending}>
      <input type="hidden" name="code" value={code} />

      <div className="file-upload">
        <p className="file-upload-label">付款截图</p>
        <p className="file-upload-desc">建议上传，便于干事快速对账出票</p>
        <label className={`file-upload-button${fileName ? " has-file" : ""}`}>
          <input
            type="file"
            name="proof"
            accept="image/*"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file ? file.name : "");
            }}
          />
          <span className="file-upload-button-text">
            {fileName ? "重新选择图片" : "点击上传付款截图"}
          </span>
        </label>
        {fileName ? (
          <p className="file-upload-name" title={fileName}>
            已选择：{fileName}
          </p>
        ) : (
          <p className="file-upload-empty">尚未选择文件</p>
        )}
      </div>

      {state.error && <div className="error">{state.error}</div>}
      <BusyButton pending={pending} pendingLabel="提交中…">
        我已付款
      </BusyButton>
      {pending && <p className="form-busy-hint">正在上传并提交，请稍候。</p>}
    </form>
  );
}
