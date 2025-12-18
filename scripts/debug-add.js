const path = require('path');
const mod = require('../out/src/commands/switchToProjectRef');
(async () => {
  try {
    const fixtures = path.join(__dirname, '..', 'src', 'test', 'fixtures');
    let called = null;
    await mod.addProjectToSolution(fixtures, 'sample.sln', 'src/NewProj/NewProj.csproj', async (cmd, args) => { called = { cmd, args }; });
    console.log('called:', called);
  } catch (err) {
    console.error('error:', err);
  }
})();