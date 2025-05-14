import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Log outgoing request
    console.log(`HTTP Request: ${request.method} ${request.url}`);
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log detailed information about the error
        console.error('HTTP Error Intercepted:', {
          url: request.url,
          method: request.method,
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        
        // Continue with the error chain
        return throwError(() => error);
      })
    );
  }
} 