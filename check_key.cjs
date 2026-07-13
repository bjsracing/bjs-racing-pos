const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb3R6c21uY3Z5ZnZleXBlZXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI6ImlhdCI6MTc0OTIyMjkzNywiZXhwIjoyMDY0Nzk4OTM3fQ.QAJ-ijCHTRBSPewAUtARpJW8SqvSrQudcp5g8XqkBUc';
console.log('Length:', key.length);
console.log('Segments:', key.split('.').length);
console.log('Part 1:', key.split('.')[0]);
console.log('Part 2:', key.split('.')[1]);
console.log('Part 3:', key.split('.')[2]);
// Decode part 2 to verify
const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
console.log('Payload:', JSON.stringify(payload, null, 2));
