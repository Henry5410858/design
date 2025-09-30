// Test file to isolate syntax issue
const doRender = async () => {
  let browser;
  try {
    console.log('test');
    return 'success';
  } catch (e) {
    console.error('Error:', e);
    throw e;
  }
};

module.exports = { doRender };