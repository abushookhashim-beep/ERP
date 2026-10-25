const LOCALE = "ar-SA-u-nu-latn-ca-gregory";

const dateOnly = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });

/** للحقول المخزنة كتاريخ فقط (بدون وقت). */
export const formatDate = (d: Date) => dateOnly.format(d);
export const formatDateTime = (d: Date) => dateTime.format(d);
