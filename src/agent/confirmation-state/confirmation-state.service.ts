import { Injectable } from '@nestjs/common';
import { PendingAction } from './pending-action.interface';

@Injectable()
export class ConfirmationStateService {
  private pendingAction: PendingAction | null = null;

  savePendingAction(action: PendingAction): void {
    this.pendingAction = action;
  }

  getPendingAction(): PendingAction | null {
    return this.pendingAction;
  }

  clearPendingAction(): void {
    this.pendingAction = null;
  }

  isConfirmation(message: string): boolean {
    const text = message.trim().toLowerCase();

    return [
      'si',
      'sí',
      'confirmo',
      'dale',
      'crear',
      'correcto',
      'ejecutar',
      'ok',
      'okay',
    ].includes(text);
  }

  isCancellation(message: string): boolean {
    const text = message.trim().toLowerCase();

    return [
      'no',
      'cancelar',
      'cancela',
      'cancelalo',
      'no crear',
      'detener',
    ].includes(text);
  }
}
