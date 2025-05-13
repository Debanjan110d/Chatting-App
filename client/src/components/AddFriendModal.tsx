import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChat } from "@/contexts/ChatContext";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AddFriendFormValues } from "@/lib/types";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addFriend } = useChat();

  const addFriendSchema = z.object({
    email: z.string().email({
      message: "Please enter a valid email address"
    })
  });

  const form = useForm<AddFriendFormValues>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (values: AddFriendFormValues) => {
    setIsSubmitting(true);
    try {
      await addFriend(values.email);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error adding friend:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-text">Add a Friend</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Enter your friend's email to send them a connection request
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email address"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
