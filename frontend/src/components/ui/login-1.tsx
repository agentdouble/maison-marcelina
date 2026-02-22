import { type FormEvent, useEffect, useRef, useState } from "react";
import { LogIn } from "lucide-react";
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
  heading = "Connexion",
  logo = {
    url: "/",
    src: "/logo-marcelina.svg",
    alt: "Maison Marcelina",
    title: "Maison Marcelina",
  },
  buttonText = "Connexion",
  googleText = "Continuer avec Google",
  signupText = "Creation sur mesure ?",
  signupUrl = "/sur-mesure",
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
      <div className="login1-card">
        <div className="login1-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
            alt=""
            loading="lazy"
          />
        </div>

        <div className="login1-panel">
          <div className="flex flex-col items-center gap-y-3 text-center">
            <a href={logo.url} aria-label="Accueil">
              <img
                src={logo.src}
                alt={logo.alt}
                title={logo.title}
                className="h-11 w-auto max-w-[220px] object-contain"
              />
            </a>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{heading}</h1>
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

            <Button type="submit" className="mt-1 w-full gap-2" disabled={isSubmitting}>
              <LogIn className="size-4" />
              {isSubmitting ? "Connexion..." : buttonText}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => startGoogleOAuth(apiBaseUrl)}
            >
              <FcGoogle className="mr-2 size-5" />
              {googleText}
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

          <div className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
            <p>{signupText}</p>
            <a href={signupUrl} className="text-primary font-medium hover:underline">
              Decouvrir
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Login1 };
