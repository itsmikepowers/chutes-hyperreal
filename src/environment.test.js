import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('interactive room presentation', () => {
  it('configures bounded orbit, pan, wheel, and touch camera controls', () => {
    expect(main).toContain("OrbitControls");
    expect(main).toMatch(/controls\.enablePan\s*=\s*true/);
    expect(main).toMatch(/controls\.enableZoom\s*=\s*true/);
    expect(main).toMatch(/controls\.minDistance\s*=\s*\d/);
    expect(main).toMatch(/controls\.maxDistance\s*=\s*\d/);
    expect(main).toContain('TOUCH.DOLLY_PAN');
  });

  it('offers an accessible reset-view control and camera instructions', () => {
    expect(html).toMatch(/id="reset-view"[^>]*aria-label="Reset camera view"/);
    expect(html).toMatch(/Orbit.*zoom.*pan/is);
    expect(main).toContain("$('#reset-view')");
  });

  it('stages the board in a furnished room with detailed wood', () => {
    for (const feature of ['createWoodTexture', 'addChair', 'addShelf', 'windowGroup', 'rug']) {
      expect(main).toContain(feature);
    }
  });
});
