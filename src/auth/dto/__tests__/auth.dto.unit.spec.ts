import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, it, expect } from 'vitest';
import { SignupDto } from '../signup.dto';
import { LoginDto } from '../login.dto';

describe('SignupDto', () => {
  it('passes with valid data', async () => {
    const dto = plainToInstance(SignupDto, {
      login: 'user1',
      password: 'pass123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const dto = plainToInstance(SignupDto, { password: 'pass123' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = plainToInstance(SignupDto, { login: 'user1' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('fails when login is empty string', async () => {
    const dto = plainToInstance(SignupDto, { login: '', password: 'pass123' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
  });
});

describe('LoginDto', () => {
  it('passes with valid data', async () => {
    const dto = plainToInstance(LoginDto, {
      login: 'user1',
      password: 'pass123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when both fields are missing', async () => {
    const dto = plainToInstance(LoginDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(2);
  });
});
