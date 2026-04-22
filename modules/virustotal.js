const axios = require("axios");
const FormData = require("form-data");
const config = require("../config");

const headers = () => ({
  "x-apikey": config.VT_API_KEY,
  "Accept": "application/json",
});

/**
 * scan a url with virustotal
 * @param {string} url - url to scan
 * @returns {object} analysis object with id
 */
async function scanUrl(url) {
  const form = new FormData();
  form.append("url", url);
  const res = await axios.post(`${config.VT_BASE_URL}/urls`, form, {
    headers: { ...headers(), ...form.getHeaders() },
  });
  return res.data.data;
}

/**
 * get url report by url id (base64url encoded url)
 * @param {string} url
 * @returns {object} report object
 */
async function getUrlReport(url) {
  const id = Buffer.from(url).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const res = await axios.get(`${config.VT_BASE_URL}/urls/${id}`, {
    headers: headers(),
  });
  return res.data.data;
}

/**
 * scan a file buffer with virustotal
 * @param {Buffer} buffer - file buffer
 * @param {string} filename - original filename
 * @returns {object} analysis object with id
 */
async function scanFile(buffer, filename) {
  if (buffer.length > config.MAX_FILE_SIZE) {
    // get upload url for large files
    const urlRes = await axios.get(`${config.VT_BASE_URL}/files/upload_url`, {
      headers: headers(),
    });
    const uploadUrl = urlRes.data.data;
    const form = new FormData();
    form.append("file", buffer, { filename });
    const res = await axios.post(uploadUrl, form, {
      headers: { ...headers(), ...form.getHeaders() },
    });
    return res.data.data;
  }

  const form = new FormData();
  form.append("file", buffer, { filename });
  const res = await axios.post(`${config.VT_BASE_URL}/files`, form, {
    headers: { ...headers(), ...form.getHeaders() },
  });
  return res.data.data;
}

/**
 * get file report by sha256/md5/sha1 hash
 * @param {string} hash
 * @returns {object} report object
 */
async function getFileReport(hash) {
  const res = await axios.get(`${config.VT_BASE_URL}/files/${hash}`, {
    headers: headers(),
  });
  return res.data.data;
}

/**
 * get analysis result by analysis id
 * @param {string} analysisId
 * @returns {object} analysis object
 */
async function getAnalysis(analysisId) {
  const res = await axios.get(`${config.VT_BASE_URL}/analyses/${analysisId}`, {
    headers: headers(),
  });
  return res.data.data;
}

/**
 * get ip address report
 * @param {string} ip
 * @returns {object} report object
 */
async function getIpReport(ip) {
  const res = await axios.get(`${config.VT_BASE_URL}/ip_addresses/${ip}`, {
    headers: headers(),
  });
  return res.data.data;
}

/**
 * get domain report
 * @param {string} domain
 * @returns {object} report object
 */
async function getDomainReport(domain) {
  const res = await axios.get(`${config.VT_BASE_URL}/domains/${domain}`, {
    headers: headers(),
  });
  return res.data.data;
}

/**
 * poll analysis until completed or max retries reached
 * @param {string} analysisId
 * @returns {object} final analysis object
 */
async function pollAnalysis(analysisId) {
  let attempts = 0;
  while (attempts < config.SCAN_MAX_RETRIES) {
    const analysis = await getAnalysis(analysisId);
    if (analysis.attributes.status === "completed") {
      return analysis;
    }
    await new Promise((r) => setTimeout(r, config.SCAN_POLL_INTERVAL));
    attempts++;
  }
  return null;
}

module.exports = {
  scanUrl,
  getUrlReport,
  scanFile,
  getFileReport,
  getAnalysis,
  getIpReport,
  getDomainReport,
  pollAnalysis,
};
