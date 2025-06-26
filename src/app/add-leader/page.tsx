'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useLanguage } from '@/context/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { indianStates, districtsByState } from '@/data/locations';
import { useToast } from "@/hooks/use-toast";
import withAuth from '@/components/with-auth';
import { addLeader } from "@/data/leaders";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  constituency: z.string().min(3, { message: "Constituency is required." }),
  electionType: z.enum(['national', 'state', 'panchayat'], { required_error: "Please select an election type." }),
  state: z.string().optional(),
  district: z.string().optional(),
  photo: z.any().optional(),
}).refine(data => {
    if (data.electionType === 'state' || data.electionType === 'panchayat') {
        return !!data.state;
    }
    return true;
}, {
    message: "State is required for this election type.",
    path: ["state"],
}).refine(data => {
    if (data.electionType === 'panchayat') {
        return !!data.district;
    }
    return true;
}, {
    message: "District is required for this election type.",
    path: ["district"],
});

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

function AddLeaderPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      constituency: "",
    },
  });

  const electionType = form.watch('electionType');
  const selectedState = form.watch('state');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let photoDataUrl = "https://placehold.co/400x400.png";
    if (values.photo instanceof File) {
        try {
            photoDataUrl = await toBase64(values.photo);
        } catch (error) {
            console.error("Error converting file to base64", error);
            toast({
                title: "Error",
                description: "Could not process image file.",
                variant: "destructive",
            });
            return;
        }
    }
    
    addLeader({
        name: values.name,
        constituency: values.constituency,
        electionType: values.electionType,
        imageUrl: photoDataUrl,
        location: {
            state: values.state,
            district: values.district
        }
    });

    toast({
      title: "Success!",
      description: t('addLeaderPage.successMessage'),
    });
    router.push('/rate-leader');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-border/20 rounded-xl">
          <CardHeader className="text-center p-8">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <UserPlus className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">{t('addLeaderPage.title')}</CardTitle>
            <CardDescription className="pt-1">{t('addLeaderPage.description')}</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addLeaderPage.nameLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addLeaderPage.namePlaceholder')} {...field} className="py-6" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="constituency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addLeaderPage.constituencyLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addLeaderPage.constituencyPlaceholder')} {...field} className="py-6" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="electionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addLeaderPage.electionTypeLabel')}</FormLabel>
                      <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('state', undefined);
                          form.setValue('district', undefined);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-6">
                            <SelectValue placeholder={t('addLeaderPage.selectElectionType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="national">{t('filterDashboard.national')}</SelectItem>
                          <SelectItem value="state">{t('filterDashboard.state')}</SelectItem>
                          <SelectItem value="panchayat">{t('filterDashboard.panchayat')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(electionType === 'state' || electionType === 'panchayat') && (
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addLeaderPage.stateLabel')}</FormLabel>
                         <Select onValueChange={(value) => {
                             field.onChange(value);
                             form.setValue('district', undefined);
                         }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="py-6">
                              <SelectValue placeholder={t('addLeaderPage.selectState')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {indianStates.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {electionType === 'panchayat' && selectedState && (
                    <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('addLeaderPage.districtLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedState}>
                            <FormControl>
                            <SelectTrigger className="py-6">
                                <SelectValue placeholder={t('addLeaderPage.selectDistrict')} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {districtsByState[selectedState] ? (
                                districtsByState[selectedState].map(district => (
                                <SelectItem key={district} value={district}>{district}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>{t('filterDashboard.noDistricts')}</SelectItem>
                            )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>{t('addLeaderPage.photoLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                if (e.target.files) {
                                    onChange(e.target.files[0]);
                                }
                            }}
                            className="py-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full py-6 text-lg">{t('addLeaderPage.submitButton')}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(AddLeaderPage);
