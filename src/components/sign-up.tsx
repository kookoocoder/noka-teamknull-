"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { signUpEmail } from "@/app/auth/action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignUp() {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleSubmit = async (formData: FormData) => {
		startTransition(async () => {
			const result = await signUpEmail({}, formData);
			
			if (result?.error) {
				toast.error(result.error);
			} else if (result?.success) {
				toast.success("Account created successfully!");
				router.push("/dashboard");
			}
		});
	};

	return (
		<form action={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="firstName" className="text-foreground">
						First name
					</Label>
					<Input
						id="firstName"
						name="firstName"
						placeholder="Max"
						required
						className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-border"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="lastName" className="text-foreground">
						Last name
					</Label>
					<Input
						id="lastName"
						name="lastName"
						placeholder="Robinson"
						required
						className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-border"
					/>
				</div>
			</div>
			
			<div className="space-y-2">
				<Label htmlFor="email" className="text-foreground">
					Email
				</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="m@example.com"
					required
					className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-border"
				/>
			</div>
			
			<div className="space-y-2">
				<Label htmlFor="password" className="text-foreground">
					Password
				</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="new-password"
					placeholder="Password"
					required
					className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-border"
				/>
			</div>
			
			<div className="space-y-2">
				<Label htmlFor="passwordConfirmation" className="text-foreground">
					Confirm Password
				</Label>
				<Input
					id="passwordConfirmation"
					name="passwordConfirmation"
					type="password"
					autoComplete="new-password"
					placeholder="Confirm Password"
					required
					className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-border"
				/>
			</div>
			
			<div className="space-y-2">
				<Label htmlFor="role" className="text-foreground">
					I am a
				</Label>
				<select
					id="role"
					name="role"
					required
					className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Select your role</option>
					<option value="FARMER">Farmer</option>
					<option value="BUYER">Buyer/Distributor</option>
					<option value="TRANSPORTER">Transporter</option>
				</select>
			</div>
			
			<Button
				type="submit"
				className="w-full"
				disabled={isPending}
			>
				{isPending ? (
					<Loader2 size={16} className="animate-spin mr-2" />
				) : null}
				Create an account
			</Button>
		</form>
	);
}