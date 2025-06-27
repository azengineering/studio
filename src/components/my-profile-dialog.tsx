'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { RotateCw, Pencil, Save } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { indianStates } from '@/data/locations';
import { useToast } from "@/hooks/use-toast";

interface MyProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const profileSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  gender: z.enum(['male', 'female', 'other']).optional(),
  age: z.number().int({ message: "Age must be a whole number." }).positive({ message: "Age must be positive." }).optional(),
  state: z.string().optional(),
  mpConstituency: z.string().optional(),
  mlaConstituency: z.string().optional(),
  panchayat: z.string().optional(),
});

export default function MyProfileDialog({ open, onOpenChange }: MyProfileDialogProps) {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      gender: undefined,
      age: undefined,
      state: undefined,
      mpConstituency: undefined,
      mlaConstituency: undefined,
      panchayat: undefined,
    }
  });

  const resetFormValues = () => {
    if (user) {
      form.reset({
        name: user.name || '',
        gender: user.gender || undefined,
        age: user.age || undefined,
        state: user.state || undefined,
        mpConstituency: user.mpConstituency || undefined,
        mlaConstituency: user.mlaConstituency || undefined,
        panchayat: user.panchayat || undefined,
      });
    }
  }

  useEffect(() => {
    if (user && open) {
      resetFormValues();
    }
  }, [user, open]);
  
  useEffect(() => {
    if (!open) {
      setIsEditing(false); // Reset editing state when dialog closes
    }
  }, [open]);


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    try {
      await updateUser(values);
      toast({ title: t('myProfileDialog.successMessage') });
      setIsEditing(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('myProfileDialog.errorMessage'),
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('myProfileDialog.title')}</DialogTitle>
          <DialogDescription>{t('myProfileDialog.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <fieldset disabled={!isEditing} className="space-y-6 group">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.nameLabel')}</FormLabel>
                      <FormControl><Input placeholder={t('myProfileDialog.namePlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.genderLabel')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('myProfileDialog.genderPlaceholder')} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">{t('myProfileDialog.genderMale')}</SelectItem>
                          <SelectItem value="female">{t('myProfileDialog.genderFemale')}</SelectItem>
                          <SelectItem value="other">{t('myProfileDialog.genderOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.ageLabel')}</FormLabel>
                      <FormControl><Input
                        type="number"
                        placeholder={t('myProfileDialog.agePlaceholder')}
                        {...field}
                        onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                        value={field.value ?? ''}
                      /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.stateLabel')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('myProfileDialog.selectState')} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {indianStates.map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="mpConstituency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.mpConstituencyLabel')}</FormLabel>
                      <FormControl><Input placeholder={t('myProfileDialog.mpConstituencyPlaceholder')} {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="mlaConstituency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.mlaConstituencyLabel')}</FormLabel>
                      <FormControl><Input placeholder={t('myProfileDialog.mlaConstituencyPlaceholder')} {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="panchayat" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('myProfileDialog.panchayatLabel')}</FormLabel>
                      <FormControl><Input placeholder={t('myProfileDialog.panchayatPlaceholder')} {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <DialogFooter className="sm:justify-end gap-2 pt-4">
              {!isEditing ? (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('myProfileDialog.editButton')}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={resetFormValues}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    {t('myProfileDialog.resetButton')}
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {t('myProfileDialog.saveButton')}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
