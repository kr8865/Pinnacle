/**
 * Generates sequential, human-readable IDs of the form PTC-{year}-{seq}
 * for studentId / registrationNumber / admissionNumber, and receipt numbers.
 * Uses a count-based sequence scoped to the current year, derived from
 * existing Student documents so it survives restarts without a separate
 * counters collection.
 */
const pad = (num, size = 4) => String(num).padStart(size, '0');

const generateSequentialCode = async (Model, field, prefix) => {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;
  const regex = new RegExp(`^${yearPrefix}\\d+$`);
  const last = await Model.findOne({ [field]: regex })
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  let nextSeq = 1;
  if (last && last[field]) {
    const parts = last[field].split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  return `${yearPrefix}${pad(nextSeq)}`;
};

const generateStudentCodes = async (Student) => {
  const [studentId, registrationNumber, admissionNumber] = await Promise.all([
    generateSequentialCode(Student, 'studentId', 'PTC'),
    generateSequentialCode(Student, 'registrationNumber', 'PTC-REG'),
    generateSequentialCode(Student, 'admissionNumber', 'PTC-ADM'),
  ]);
  return { studentId, registrationNumber, admissionNumber };
};

const generateReceiptNumber = async (Receipt) => generateSequentialCode(Receipt, 'receiptNumber', 'PTC-RCPT');

module.exports = { generateSequentialCode, generateStudentCodes, generateReceiptNumber };
