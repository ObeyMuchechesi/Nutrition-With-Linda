const app = require('../../../server/app');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const bookingId = url.searchParams.get('bookingId');
  if (!bookingId || !/^[a-f\d]{24}$/i.test(bookingId)) {
    return res.status(400).json({ message: 'Choose a valid booking.' });
  }

  url.searchParams.delete('bookingId');
  req.url = `/api/admin/bookings/${bookingId}/status${url.search}`;
  return app(req, res);
};
