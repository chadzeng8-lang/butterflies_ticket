export type IdDocType = "mainland_id" | "hk_home_return" | "student_id";

export type AttendeeIdMode = "id_card" | "student_id";

export type OrderAttendee = {
  id?: number;
  sortIndex: number;
  fullName: string;
  phone: string;
  idDocType: IdDocType;
  idNumber: string;
};

export const ID_DOC_TYPE_LABEL: Record<IdDocType, string> = {
  mainland_id: "身份证（内地）",
  hk_home_return: "回乡证（香港）",
  student_id: "学号",
};

export function isIdDocType(value: string): value is IdDocType {
  return (
    value === "mainland_id" ||
    value === "hk_home_return" ||
    value === "student_id"
  );
}

/** 宽松校验：内地 18 位身份证；回乡证常见为字母+数字；学号为字母数字 */
export function validateIdNumber(
  docType: IdDocType,
  raw: string,
): string | null {
  const idNumber = raw.trim().toUpperCase();
  if (!idNumber) {
    return docType === "student_id" ? "请填写学号。" : "请填写证件号。";
  }
  if (docType === "mainland_id") {
    if (!/^\d{17}[\dX]$/i.test(idNumber)) {
      return "内地身份证一般为 18 位（末位可为 X）。";
    }
    return null;
  }
  if (docType === "student_id") {
    if (!/^[A-Z0-9]{4,20}$/.test(idNumber)) {
      return "学号一般为 4–20 位字母或数字，请核对后重填。";
    }
    return null;
  }
  if (!/^[A-Z0-9]{8,18}$/.test(idNumber)) {
    return "回乡证号码格式不正确，请核对后重填。";
  }
  return null;
}

export function parseAttendeesFromFormData(
  formData: FormData,
  quantity: number,
  idMode: AttendeeIdMode = "id_card",
): { attendees: OrderAttendee[]; error?: string } {
  const attendees: OrderAttendee[] = [];
  for (let i = 1; i <= quantity; i += 1) {
    const fullName = String(formData.get(`attendee_${i}_name`) || "").trim();
    const phone = String(formData.get(`attendee_${i}_phone`) || "").trim();
    const idDocTypeRaw =
      idMode === "student_id"
        ? "student_id"
        : String(formData.get(`attendee_${i}_id_doc_type`) || "").trim();
    const idNumber = String(formData.get(`attendee_${i}_id_number`) || "")
      .trim()
      .toUpperCase();

    if (!fullName || !phone || !idDocTypeRaw || !idNumber) {
      return {
        attendees: [],
        error:
          idMode === "student_id"
            ? `请完整填写第 ${i} 位观众的姓名、电话与学号。`
            : `请完整填写第 ${i} 位观众的姓名、电话与证件信息。`,
      };
    }
    if (!isIdDocType(idDocTypeRaw)) {
      return {
        attendees: [],
        error:
          idMode === "student_id"
            ? `第 ${i} 位观众的学号类型无效。`
            : `第 ${i} 位观众的证件类型无效。`,
      };
    }
    if (idMode === "student_id" && idDocTypeRaw !== "student_id") {
      return { attendees: [], error: `第 ${i} 位观众本场请填写学号。` };
    }
    if (idMode === "id_card" && idDocTypeRaw === "student_id") {
      return {
        attendees: [],
        error: `第 ${i} 位观众本场请填写身份证或回乡证。`,
      };
    }
    const idError = validateIdNumber(idDocTypeRaw, idNumber);
    if (idError) {
      return { attendees: [], error: `第 ${i} 位观众：${idError}` };
    }
    attendees.push({
      sortIndex: i,
      fullName,
      phone,
      idDocType: idDocTypeRaw,
      idNumber,
    });
  }
  return { attendees };
}

export function attendeesToJson(attendees: OrderAttendee[]) {
  return attendees.map((item) => ({
    full_name: item.fullName,
    phone: item.phone,
    id_doc_type: item.idDocType,
    id_number: item.idNumber,
  }));
}
