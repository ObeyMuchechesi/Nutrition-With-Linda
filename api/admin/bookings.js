const app = require('../../server/app');

module.exports = (req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const patientAction = requestUrl.searchParams.get('patientAction');

  if (patientAction === 'patients' || patientAction === 'measurements') {
    requestUrl.searchParams.delete('patientAction');
    const endpoint = patientAction === 'patients' ? 'patients' : 'patients/measurements';
    req.url = `/api/admin/${endpoint}${requestUrl.search}`;
  }

  return app(req, res);
};
