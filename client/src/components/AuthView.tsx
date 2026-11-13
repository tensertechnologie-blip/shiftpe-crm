import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShiftPeLogo } from './ShiftPeLogo';
import { Shield, KeyRound, QrCode, ArrowRight, Copy, Check, AlertCircle, Lock, Sun, Moon, Mail, Send, ShieldAlert, Zap } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithPassword, verifyTotp } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // First-time registration form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState('');
  const [devPasswordPreview, setDevPasswordPreview] = useState<string | undefined>();

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state
  const [totpStep, setTotpStep] = useState<'none' | 'setup' | 'verify'>('none');
  const [tempToken, setTempToken] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | undefined>();
  const [manualSecret, setManualSecret] = useState<string | undefined>();
  const [totpCode, setTotpCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handlePasswordSubmit = async (e?: React.FormEvent, bypassTotp: boolean = false) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!/@shiftpe\.(com|in)$/i.test(email.trim())) {
      setErrorMessage('Access is restricted to official @shiftpe.in or @shiftpe.com team email addresses.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await loginWithPassword(email.trim(), password, bypassTotp);
      if (response.status === 'authenticated') {
        return;
      }
      setTempToken(response.tempToken || '');

      if (response.status === 'totp_setup_required') {
        setQrCodeData(response.qrCode);
        setManualSecret(response.manualSecret);
        setTotpStep('setup');
      } else {
        setTotpStep('verify');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (totpCode.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyTotp(tempToken, totpCode.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid authenticator code. Please check your app.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRegistrationSuccessMsg('');
    setDevPasswordPreview(undefined);

    const cleanEmail = registerEmail.trim().toLowerCase();
    if (!/@shiftpe\.(com|in)$/i.test(cleanEmail)) {
      setErrorMessage('First-time registration is restricted to official @shiftpe.in or @shiftpe.com business email addresses.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: registerName.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register teammate');
      }

      setRegistrationSuccessMsg(data.message);
      if (data.devPassword) {
        setDevPasswordPreview(data.devPassword);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedToSignInWithCreds = (userEmail: string, userPwd?: string) => {
    setEmail(userEmail);
    if (userPwd) {
      setPassword(userPwd);
    }
    setAuthMode('login');
    setRegistrationSuccessMsg('');
    setErrorMessage('');
  };

  const copySecretToClipboard = () => {
    if (manualSecret) {
      navigator.clipboard.writeText(manualSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const fillQuickCredentials = (role: 'ceo' | 'member') => {
    if (role === 'ceo') {
      setEmail('ajay.founder@shiftpe.in');
      setPassword('ShiftPeCeo2026!');
    } else {
      setEmail('sample.alex@shiftpe.com');
      setPassword('ShiftPeSample2026!');
    }
    setErrorMessage('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Background Glows */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-green-glow) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--shiftpe-teal-glow) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--shiftpe-teal-glow) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Floating Theme Switcher */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--line)',
          backgroundColor: 'var(--panel)',
          color: 'var(--text)',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: 'var(--card-shadow)',
          zIndex: 20
        }}
      >
        {theme === 'dark' ? <Sun size={14} color="var(--shiftpe-teal)" /> : <Moon size={14} color="var(--accent-amber)" />}
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Main Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '38px',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header with Official ShiftPe Lockup */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <ShiftPeLogo size="lg" showSubtitle subtitleText="Find work. Near you. • Team Portal" />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: 'rgba(255, 82, 82, 0.1)',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#ff8a8a',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Mode Tabs (Sign In vs First-Time Teammate Registration) */}
        {totpStep === 'none' && (
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            padding: '3px',
            marginBottom: '22px'
          }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
                setRegistrationSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: authMode === 'login' ? 700 : 500,
                color: authMode === 'login' ? '#ffffff' : 'var(--muted)',
                backgroundColor: authMode === 'login' ? 'var(--shiftpe-coral)' : 'transparent',
                boxShadow: authMode === 'login' ? '0 2px 8px var(--shiftpe-coral-glow)' : 'none',
                transition: 'var(--transition)'
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
                setRegistrationSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: authMode === 'register' ? 700 : 500,
                color: authMode === 'register' ? '#ffffff' : 'var(--muted)',
                backgroundColor: authMode === 'register' ? 'var(--shiftpe-coral)' : 'transparent',
                boxShadow: authMode === 'register' ? '0 2px 8px var(--shiftpe-coral-glow)' : 'none',
                transition: 'var(--transition)'
              }}
            >
              First-Time Teammate
            </button>
          </div>
        )}

        {/* Step 1A: First-Time Teammate Registration */}
        {totpStep === 'none' && authMode === 'register' && (
          <div>
            {registrationSuccessMsg ? (
              <div style={{
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--shiftpe-coral-border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  border: '1px solid var(--shiftpe-coral)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--shiftpe-coral)',
                  marginBottom: '14px'
                }}>
                  <Mail size={22} />
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                  Temporary Password Dispatched!
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                  We have sent your initial access credentials to <strong>{registerEmail}</strong>. Please check your business email inbox.
                </p>

                {devPasswordPreview && (
                  <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px dashed var(--shiftpe-coral)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--shiftpe-coral)', fontWeight: 700, letterSpacing: '0.6px', marginBottom: '4px' }}>
                      ⚡ Dev Fast-Fill Mode (Temporary Password):
                    </div>
                    <code style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {devPasswordPreview}
                    </code>
                    <button
                      type="button"
                      onClick={() => proceedToSignInWithCreds(registerEmail, devPasswordPreview)}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: 'var(--shiftpe-coral-light)',
                        border: '1px solid var(--shiftpe-coral-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--shiftpe-coral)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Autofill & Proceed to Sign In &rarr;
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => proceedToSignInWithCreds(registerEmail)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'var(--shiftpe-coral)',
                    color: 'var(--button-text-on-coral)',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                    ShiftPe Business Email
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="your.name@shiftpe.in"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'var(--transition)'
                    }}
                  />
                  <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>
                    Must be your official provisioned @shiftpe.in company address
                  </span>

                  {/* Provisioned mailbox shortcuts */}
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                      Directory Whitelist:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                      {[
                        'ritesh.founder@shiftpe.in',
                        'shubham.yambadwar@shiftpe.in',
                        'prafull.dongre@shiftpe.in',
                        'ajay.founder@shiftpe.in',
                        'support@shiftpe.in'
                      ].map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setRegisterEmail(em)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-subtle)',
                            border: '1px solid var(--line)',
                            color: 'var(--muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {em.split('@')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'var(--transition)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--shiftpe-coral)',
                    color: 'var(--button-text-on-coral)',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition)',
                    boxShadow: '0 4px 14px var(--shiftpe-coral-glow)'
                  }}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Dispatching Password...' : 'Send Password to Business Email'}</span>
                </button>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage('');
                    }}
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Already have access credentials? Sign In here
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 1B: Email & Password Sign In */}
        {totpStep === 'none' && authMode === 'login' && (
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                ShiftPe Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@shiftpe.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-green)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
              />
              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>
                Must be an active @shiftpe.com company mailbox
              </span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-green)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--shiftpe-teal)',
                color: 'var(--button-text-on-teal)',
                fontWeight: 700,
                fontSize: '13.5px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition)',
                boxShadow: '0 4px 14px var(--shiftpe-teal-glow)'
              }}
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Continue with 2FA</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePasswordSubmit(undefined, true)}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '12.5px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Zap size={14} color="var(--shiftpe-coral)" />
              <span>Direct Sign In (Password Only / Skip 2FA)</span>
            </button>

            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                }}
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                First time at ShiftPe? <span style={{ color: 'var(--shiftpe-coral)', fontWeight: 600 }}>Register your business email &rarr;</span>
              </button>
            </div>

            {/* Quick autofill helper for development & testing */}
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: 700 }}>
                Seed Demo Credentials
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('ceo')}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    fontSize: '11.5px',
                    backgroundColor: 'rgba(180, 0, 255, 0.1)',
                    border: '1px solid rgba(180, 0, 255, 0.3)',
                    color: '#d47aff',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600
                  }}
                >
                  Fill CEO Account
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('member')}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    fontSize: '11.5px',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    color: 'var(--accent-green)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600
                  }}
                >
                  Fill Sample Member
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2A: TOTP Setup (QR code + secret key) */}
        {totpStep === 'setup' && (
          <form onSubmit={handleTotpSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '10px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 255, 136, 0.12)',
                color: 'var(--accent-green)',
                marginBottom: '10px'
              }}>
                <QrCode size={26} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                Setup Two-Factor Authenticator
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Scan this QR code using Google Authenticator, Authy, or 1Password.
              </p>
            </div>

            {/* QR Code Container */}
            {qrCodeData && (
              <div style={{
                textAlign: 'center',
                backgroundColor: '#ffffff',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                width: 'fit-content',
                margin: '0 auto 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
              }}>
                <img
                  src={qrCodeData}
                  alt="ShiftPe 2FA QR Code"
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              </div>
            )}

            {/* Manual Secret Key */}
            {manualSecret && (
              <div style={{
                marginBottom: '18px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Manual Setup Key
                  </span>
                  <code style={{ fontSize: '12px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                    {manualSecret}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copySecretToClipboard}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--line)',
                    color: copiedSecret ? 'var(--accent-green)' : 'var(--muted)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedSecret ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}

            {/* 6-Digit Code Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', textAlign: 'center' }}>
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-green)',
                  fontSize: '22px',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-green)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || totpCode.length !== 6}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: 'var(--accent-green)',
                color: '#000000',
                fontWeight: 700,
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition)',
                boxShadow: '0 4px 14px var(--accent-green-glow)',
                opacity: totpCode.length === 6 ? 1 : 0.6
              }}
            >
              <Shield size={16} />
              <span>Verify & Activate Session</span>
            </button>

            {/* Emergency Bypass for Setup Step */}
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={async () => {
                  setTotpCode('888999');
                  setIsSubmitting(true);
                  try {
                    await verifyTotp(tempToken, '888999');
                  } catch (err: any) {
                    setErrorMessage(err.message || 'Emergency verification failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px',
                  backgroundColor: 'transparent',
                  border: '1px dashed var(--shiftpe-coral)',
                  color: 'var(--shiftpe-coral)',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={13} />
                <span>No Authenticator App? Use Emergency Bypass (888999)</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 2B: TOTP Verification on returning login */}
        {totpStep === 'verify' && (
          <form onSubmit={handleTotpSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '12px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 123, 245, 0.12)',
                color: 'var(--accent-blue)',
                marginBottom: '10px'
              }}>
                <KeyRound size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                Two-Factor Verification
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Enter the current 6-digit code from your authenticator app for <strong>{email}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-green)',
                  fontSize: '24px',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-green)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || totpCode.length !== 6}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: 'var(--accent-blue)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition)',
                boxShadow: '0 4px 14px rgba(59, 123, 245, 0.3)',
                opacity: totpCode.length === 6 ? 1 : 0.6
              }}
            >
              <Lock size={16} />
              <span>Verify & Sign In</span>
            </button>

            {/* Authenticator App Missing / Uninstalled Helper */}
            <div style={{
              marginTop: '18px',
              padding: '14px',
              backgroundColor: 'rgba(255, 95, 85, 0.08)',
              border: '1px dashed var(--shiftpe-coral)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12.5px', color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldAlert size={15} color="var(--shiftpe-coral)" />
                <strong>Google Authenticator app uninstalled or lost?</strong>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                You can enter emergency passcode <code style={{ color: 'var(--shiftpe-coral)', fontWeight: 700 }}>888999</code> or click below to bypass directly:
              </p>
              <button
                type="button"
                onClick={async () => {
                  setTotpCode('888999');
                  setIsSubmitting(true);
                  try {
                    await verifyTotp(tempToken, '888999');
                  } catch (err: any) {
                    setErrorMessage(err.message || 'Emergency verification failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--shiftpe-coral)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px var(--shiftpe-coral-glow)'
                }}
              >
                <Zap size={14} />
                <span>One-Click Emergency Bypass (888999) & Sign In</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setTotpStep('none');
                setTotpCode('');
                setErrorMessage('');
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                fontSize: '12.5px',
                color: 'var(--muted)',
                textAlign: 'center'
              }}
            >
              &larr; Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
