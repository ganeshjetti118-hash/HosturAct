import { jsPDF } from 'jspdf';

const INK = [30, 41, 59]; // #1E293B
const PRIMARY = [99, 102, 241]; // #6366F1
const MUTED = [100, 116, 139]; // slate-500
const LINE = [226, 232, 240]; // slate-200

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export function downloadResultsPdf(quiz, participants) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const Mx = 48;
  let y = 56;

  // Header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.text('HOSTURACT · FINAL RESULTS', Mx, y);
  y += 22;

  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text(quiz.title || 'Quiz Results', Mx, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const meta = [
    quiz.topic && `Topic: ${quiz.topic}`,
    quiz.joinCode && `Room PIN: ${quiz.joinCode}`,
    `${participants.length} participant${participants.length !== 1 ? 's' : ''}`,
    `${quiz.totalQuestions || (quiz.questions?.length || 0)} items`,
    `Generated ${new Date().toLocaleString()}`,
  ].filter(Boolean).join('   ·   ');
  doc.text(meta, Mx, y, { maxWidth: W - Mx * 2 });
  y += 22;

  // Podium
  const podium = participants.slice(0, 3);
  if (podium.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text('THE PODIUM', Mx, y);
    y += 14;
    const labels = ['Champion', 'Runner-up', 'Third Place'];
    podium.forEach((p, i) => {
      doc.setDrawColor(...LINE);
      doc.setFillColor(245, 247, 255);
      doc.roundedRect(Mx, y, W - Mx * 2, 40, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text(`#${i + 1}`, Mx + 14, y + 25);
      doc.setTextColor(...INK);
      doc.text(p.nickname, Mx + 44, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(labels[i] || '', Mx + 44, y + 34);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...INK);
      doc.text(String(p.score).toLocaleString(), W - Mx - 14, y + 25, { align: 'right' });
      y += 48;
    });
    y += 8;
  }

  // Full standings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.text('FULL STANDINGS', Mx, y);
  y += 12;

  // Table header
  doc.setFillColor(...INK);
  doc.rect(Mx, y, W - Mx * 2, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RANK', Mx + 12, y + 16);
  doc.text('PARTICIPANT', Mx + 64, y + 16);
  doc.text('SCORE', W - Mx - 150, y + 16, { align: 'right' });
  doc.text('CORRECT', W - Mx - 80, y + 16, { align: 'right' });
  doc.text('ACCURACY', W - Mx - 14, y + 16, { align: 'right' });
  y += 24;

  participants.forEach((p, i) => {
    if (y > doc.internal.pageSize.getHeight() - 48) {
      doc.addPage();
      y = 56;
    }
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(Mx, y, W - Mx * 2, 22, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...(i < 3 ? PRIMARY : MUTED));
    doc.text(String(i + 1).padStart(2, '0'), Mx + 12, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(p.nickname, Mx + 64, y + 15, { maxWidth: 220 });
    doc.setTextColor(...INK);
    doc.text(String(p.score).toLocaleString(), W - Mx - 150, y + 15, { align: 'right' });
    const correct = p.correctCount || 0;
    const total = p.totalQuestions || quiz.totalQuestions || 0;
    doc.text(`${correct}/${total}`, W - Mx - 80, y + 15, { align: 'right' });
    doc.text(`${total ? Math.round((correct / total) * 100) : 0}%`, W - Mx - 14, y + 15, { align: 'right' });
    y += 22;
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`HosturAct · ${new Date().toLocaleDateString()}`, Mx, doc.internal.pageSize.getHeight() - 24);
    doc.text(`Page ${i} of ${pages}`, W - Mx, doc.internal.pageSize.getHeight() - 24, { align: 'right' });
  }

  const safe = (quiz.title || 'quiz-results').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`${safe}-results.pdf`);
}