import { type FormEvent, useEffect, useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { loginWithPassword, startGoogleOAuth, type AuthSessionPayload } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Login1Props {
  heading?: string;
  logo?: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  buttonText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
  apiBaseUrl?: string;
  onLoginSuccess?: (payload: AuthSessionPayload) => void;
}

const Login1 = ({
  heading,
  logo = {
    url: "/",
    src: "/logo-marcelina.svg",
    alt: "Maison Marcelina",
    title: "Maison Marcelina",
  },
  buttonText = "Entrer",
  googleText = "Continuer avec Google",
  signupText = "Mot de passe oublie ?",
  signupUrl = "/contact",
  apiBaseUrl,
  onLoginSuccess,
}: Login1Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload = await loginWithPassword({
        apiBaseUrl,
        email: email.trim(),
        password,
        signal: controller.signal,
      });

      if (!mountedRef.current) {
        return;
      }

      localStorage.setItem("mm_auth_session", JSON.stringify(payload));
      setSuccessMessage("Connecte");
      onLoginSuccess?.(payload);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (!mountedRef.current) {
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "Connexion impossible");
    } finally {
      if (!mountedRef.current || requestRef.current !== controller) {
        return;
      }
      requestRef.current = null;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login1-shell">
      <div className="flex h-full items-center justify-center">
        <div className="login1-card border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-7 rounded-xl border px-6 py-10 shadow-md">
          <div className="flex flex-col items-center gap-y-3 text-center">
            <a href={logo.url} aria-label="Accueil">
              <img
                src={logo.src}
                alt={logo.alt}
                title={logo.title}
                className="h-11 w-auto max-w-[220px] object-contain"
              />
            </a>
            {heading ? (
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {heading}
              </h1>
            ) : null}
          </div>

          <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Patiente..." : buttonText}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              aria-label={googleText}
              onClick={() => startGoogleOAuth(apiBaseUrl)}
            >
              <FcGoogle className="size-5" />
              <span className="sr-only">{googleText}</span>
            </Button>
          </form>

          {errorMessage && (
            <p className="text-center text-xs font-medium uppercase tracking-[0.08em] text-destructive">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-center text-xs font-medium uppercase tracking-[0.08em] text-primary">
              {successMessage}
            </p>
          )}

          <div className="text-muted-foreground flex items-center justify-center text-sm">
            <a href={signupUrl} className="text-primary font-medium hover:underline">
              {signupText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Login1 };
