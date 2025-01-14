import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any) {
    console.error('Une erreur est survenue:', error);
    // Ici nous pourrions ajouter une logique pour afficher l'erreur à l'utilisateur
  }
}
