import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth, ApiError } from '../auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.login(this.form.getRawValue()).pipe(
      finalize(() => (this.isSubmitting = false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/home'),
      error: error => {
        const apiError = error.error as Partial<ApiError> | string | null;
        this.errorMessage = typeof apiError === 'string'
          ? apiError
          : apiError?.message ?? 'Не вдалося увійти. Перевірте дані та спробуйте ще раз.';
      },
    });
  }
}
