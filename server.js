require('dotenv').config();

const app = require('./server/app');
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Nutrition with Linda API listening on port ${port}`);
});
