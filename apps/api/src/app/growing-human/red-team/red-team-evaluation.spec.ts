import { GrowingHumanService } from '../growing-human.service';
import { RED_TEAM_CASES } from './red-team-cases';
import { evaluateRedTeam } from './red-team-evaluation';

describe('evaluateRedTeam', () => {
  it('keeps the launch gate closed while the service only returns the preview reply', () => {
    const service = new GrowingHumanService();
    const report = evaluateRedTeam(RED_TEAM_CASES, (request) => service.reply(request));

    expect(report.passed).toBe(false);
    expect(report.strictPassRate).toBe(0);
  });
});
