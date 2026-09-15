import { createApp } from './app.js';

const app = createApp();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`POS server running on port ${PORT}`);
});
