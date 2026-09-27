import { GrowingHumanService } from '../growing-human.service';
import { GuidePromptService } from '../prompt/guide-prompt.service';
import { OpenRouterClient } from '../provider/openrouter.client';
import { InputSafetyService } from '../safety/input-safety.service';
import { RED_TEAM_CASES } from './red-team-cases';
import { evaluateRedTeam } from './red-team-evaluation';

describe('evaluateRedTeam', () => {
  it('passes every deterministic high-risk case while keeping the model launch gate closed', async () => {
    const service = new GrowingHumanService(new InputSafetyService(), new GuidePromptService(), {
      guideEnabled: false,
    } as OpenRouterClient);
    const report = await evaluateRedTeam(RED_TEAM_CASES, (request) => service.reply(request));

    expect(report.passed).toBe(false);
    expect(report.strictPassRate).toBe(1);
    expect(report.overallPassRate).toBeLessThan(0.95);
  });
});
