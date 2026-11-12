import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-paciente',
  imports: [QRCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="qr">
      <qrcode
        [qrdata]="codigo()"
        [width]="tamano()"
        [margin]="1"
        errorCorrectionLevel="M"
        elementType="svg"
        colorDark="#002F87"
        [ariaLabel]="'Código QR ' + codigo()"
      />
      <figcaption>{{ codigo() }}</figcaption>
    </figure>
  `,
})
export class QrPaciente {
  readonly codigo = input.required<string>();
  readonly tamano = input(112);
}
