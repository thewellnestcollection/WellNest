import { useState } from "react";
import { useSubscribeNewsletter } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

interface NewsletterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewsletterModal({ open, onOpenChange }: NewsletterModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const subscribe = useSubscribeNewsletter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    subscribe.mutate(
      { data: { firstName, lastName, email } },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Something went wrong. Please try again.";
          setErrorMsg(msg);
        },
      }
    );
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setSuccess(false);
      setErrorMsg("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Join The WellNest Collection
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-light">
            <strong>Subscribe to our free monthly newsletter</strong> and be the first to discover our handpicked wellness stays.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <p className="font-serif text-xl">You're in!</p>
            <p className="text-muted-foreground text-sm font-light">
              Thank you for subscribing. Look out for your first curation in your inbox soon.
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-widest mt-2"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-none"
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-none"
                  placeholder="Smith"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none"
                placeholder="jane@example.com"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-destructive font-light">{errorMsg}</p>
            )}

            <Button
              type="submit"
              disabled={subscribe.isPending}
              className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 uppercase text-xs tracking-widest font-medium"
            >
              {subscribe.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Subscribe
            </Button>

            <p className="text-center text-xs text-muted-foreground/70 font-light">
              No spam, ever. Unsubscribe at any time.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
