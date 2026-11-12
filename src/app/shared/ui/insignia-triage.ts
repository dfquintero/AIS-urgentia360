import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NivelTriageId } from '../../core/models/urgencias.models';

@Component({
  selector: 'app-insignia-triage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (nivel(); as n) {
      <span class="insignia triage-{{ n }}" [attr.aria-label]="'Triage ' + n">T-{{ n }}</span>
    } @else {
      <span class="insignia insignia-neutra">Sin triage</span>
    }
  `,
})
export class InsigniaTriage {
  readonly nivel = input<NivelTriageId | null>(null);
}
