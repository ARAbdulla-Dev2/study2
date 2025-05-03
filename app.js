const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const dataFilePath = path.join(__dirname, 'data', 'data.json');

// Helper to calculate rank
const calculateRank = (studied, total) => {
  const percentage = (studied / total) * 100;

  if (percentage < 35) return `Rookie-${Math.ceil(percentage / 7)}`;
  if (percentage < 55) return `Veteran-${Math.ceil((percentage - 35) / 4)}`;
  if (percentage < 65) return `Elite-${Math.ceil((percentage - 55) / 2)}`;
  if (percentage < 75) return `Pro-${Math.ceil((percentage - 65) / 2)}`;
  return `Master-${Math.ceil((percentage - 75) / 5)}`;
};

// API to fetch subjects
app.get('/api/subjects', (req, res) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to load data' });
    res.json(JSON.parse(data));
  });
});

app.post('/api/subjects/update', (req, res) => {
  const { subject, studiedLessons } = req.body;

  if (!subject || typeof studiedLessons !== 'number' || studiedLessons < 0) {
    return res.json({ success: false, error: 'Invalid input' });
  }

  // Read the latest subjects data from file
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to load data' });
    }

    let subjects = JSON.parse(data); // Parse JSON file to get subjects array
    const subjectIndex = subjects.findIndex((s) => s.subject === subject);
    
    if (subjectIndex === -1) {
      return res.json({ success: false, error: 'Subject not found' });
    }

    const currentSubject = subjects[subjectIndex];

    if (studiedLessons > currentSubject.totalLessons) {
      return res.json({ success: false, error: 'Studied lessons cannot exceed total lessons' });
    }

    // Update studied lessons
subjects[subjectIndex].studiedLessons = studiedLessons;

// Calculate and store rank
subjects[subjectIndex].rank = calculateRank(
  studiedLessons,
  subjects[subjectIndex].totalLessons
);

// Save the updated data back to file
fs.writeFile(dataFilePath, JSON.stringify(subjects, null, 2), (writeErr) => {
  if (writeErr) {
    return res.status(500).json({ success: false, error: 'Failed to save data' });
  }
  res.json({
    success: true,
    message: 'Updated successfully',
    updatedSubject: subjects[subjectIndex]
  });
});
  });
});


let port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`app running on ${port} `);
});