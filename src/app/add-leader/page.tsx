'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';
import { UserPlus } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from '@/components/header';
import Footer from '@/components/footer';
import withAuth from '@/components/with-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from "@/hooks/use-toast";
import { addLeader } from '@/data/leaders';
import { indianStates, districtsByState } from '@/data/locations';


const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  constituency: z.string().min(1, { message: "Constituency is required." }),
  electionType: z.enum(['national', 'state', 'panchayat'], { required_error: "Please select an election type."}),
  state: z.string().optional(),
  district: z.string().optional(),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
}).refine(data => {
    if (data.electionType === 'state' || data.electionType === 'panchayat') {
        return !!data.state;
    }
    return true;
}, {
  message: "State is required",
  path: ["state"],
}).refine(data => {
    if (data.electionType === 'panchayat') {
        return !!data.district;
    }
    return true;
}, {
  message: "District is required",
  path: ["district"],
});


function AddLeaderPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      constituency: "",
      state: "",
      district: "",
      imageUrl: "",
    },
  });

  const electionType = form.watch('electionType');
  const selectedState = form.watch('state');

  function onSubmit(values: z.infer<typeof formSchema>) {
    addLeader({
        name: values.name,
        constituency: values.constituency,
        electionType: values.electionType,
        location: {
            state: values.state,
            district: values.district,
        },
        imageUrl: values.imageUrl || 'https://placehold.co/400x400.png',
    });

    toast({
        title: t('addLeaderPage.successMessage'),
    });

    form.reset();
    router.push('/rate-leader');
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-start">
         <Card className="w-full max-w-2xl shadow-lg border-border/20">
             <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-headline">{t('addLeaderPage.title')}</CardTitle>
                    <CardDescription>{t('addLeaderPage.description')}</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.nameLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.namePlaceholder')} {...field} />
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
                                        <Input placeholder={t('addLeaderPage.constituencyPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="electionType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('addLeaderPage.electionTypeLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
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
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('addLeaderPage.photoLabel')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t('addLeaderPage.photoPlaceholder')} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>

                        {(electionType === 'state' || electionType === 'panchayat') && (
                             <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('addLeaderPage.stateLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
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

                        {electionType === 'panchayat' && (
                            <FormField
                                control={form.control}
                                name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('addLeaderPage.districtLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedState}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('addLeaderPage.selectDistrict')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {selectedState && districtsByState[selectedState] ? (
                                                    districtsByState[selectedState].map(district => (
                                                        <SelectItem key={district} value={district}>{district}</SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="none" disabled>
                                                        {selectedState ? t('filterDashboard.noDistricts') : t('filterDashboard.selectStateFirst')}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <Button type="submit" className="w-full py-6 text-lg">
                           {t('addLeaderPage.submitButton')}
                        </Button>
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
