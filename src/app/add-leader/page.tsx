'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2 } from 'lucide-react';

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
import Header from '@/components/header';
import Footer from '@/components/footer';
import withAuth from '@/components/with-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from "@/hooks/use-toast";
import { addLeader } from '@/data/leaders';
import { indianStates, districtsByState } from '@/data/locations';


const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  electionType: z.enum(['national', 'state', 'panchayat'], { required_error: "Please select an election type."}),
  partyName: z.string().min(1, { message: "Party name is required." }),
  constituency: z.string().min(1, { message: "Constituency is required." }),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Please select a gender."}),
  nativeAddress: z.string().min(1, { message: "Native address is required." }),
  state: z.string().optional(),
  district: z.string().optional(),
  previousElections: z.array(z.object({
    electionType: z.string().min(1, { message: "Required" }),
    constituency: z.string().min(1, { message: "Required" }),
    status: z.enum(['winner', 'loser']),
    electionYear: z.string().min(4, { message: "Invalid year" }).max(4, { message: "Invalid year" }),
    partyName: z.string().min(1, { message: "Required" }),
  })).optional(),
  photoUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  manifestoUrl: z.string().url({ message: "Please enter a valid PDF URL." }).optional().or(z.literal('')),
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
      partyName: "",
      constituency: "",
      nativeAddress: "",
      state: "",
      district: "",
      previousElections: [],
      photoUrl: "",
      manifestoUrl: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "previousElections"
  });

  const electionType = form.watch('electionType');
  const selectedState = form.watch('state');

  function onSubmit(values: z.infer<typeof formSchema>) {
    addLeader({
        name: values.name,
        partyName: values.partyName,
        constituency: values.constituency,
        electionType: values.electionType,
        gender: values.gender,
        nativeAddress: values.nativeAddress,
        location: {
            state: values.state,
            district: values.district,
        },
        previousElections: values.previousElections || [],
        photoUrl: values.photoUrl || 'https://placehold.co/400x400.png',
        manifestoUrl: values.manifestoUrl,
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
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 max-w-4xl">
            <h1 className="font-headline text-3xl font-extrabold text-primary">{t('addLeaderPage.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('addLeaderPage.description')}</p>
        </div>
            
        <div className="max-w-4xl p-8 bg-card border rounded-lg shadow-sm">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* --- Row 1 --- */}
                    <div className="grid md:grid-cols-3 gap-6">
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
                            name="partyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.partyNameLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.partyNamePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* --- Conditional location fields --- */}
                     <div className="grid md:grid-cols-2 gap-6">
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
                    </div>

                    {/* --- Row 2 --- */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="constituency"
                            render={({ field }) => (
                                <FormItem className="md:col-span-1">
                                    <FormLabel>{t('addLeaderPage.constituencyLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.constituencyPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('addLeaderPage.genderLabel')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t('addLeaderPage.genderPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="male">{t('addLeaderPage.genderMale')}</SelectItem>
                                    <SelectItem value="female">{t('addLeaderPage.genderFemale')}</SelectItem>
                                    <SelectItem value="other">{t('addLeaderPage.genderOther')}</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nativeAddress"
                            render={({ field }) => (
                                <FormItem className="md:col-span-1">
                                    <FormLabel>{t('addLeaderPage.nativeAddressLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.nativeAddressPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    {/* --- Row 3: Previous Elections --- */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">{t('addLeaderPage.previousElectionsTitle')}</h3>
                      <div className="space-y-4">
                        {fields.map((item, index) => (
                          <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 p-4 border rounded-md relative">
                            <FormField
                              control={form.control}
                              name={`previousElections.${index}.electionType`}
                              render={({ field }) => (
                                <FormItem className="col-span-12 md:col-span-3">
                                  <FormLabel className="text-xs">{t('addLeaderPage.electionTypeLabel')}</FormLabel>
                                  <Input {...field} placeholder="e.g., State" />
                                   <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`previousElections.${index}.constituency`}
                              render={({ field }) => (
                                <FormItem className="col-span-12 md:col-span-3">
                                  <FormLabel className="text-xs">{t('addLeaderPage.previousConstituencyLabel')}</FormLabel>
                                  <Input {...field} placeholder="e.g., Pune Assembly" />
                                   <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`previousElections.${index}.status`}
                              render={({ field }) => (
                                <FormItem className="col-span-6 md:col-span-2">
                                  <FormLabel className="text-xs">{t('addLeaderPage.statusLabel')}</FormLabel>
                                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="winner">{t('addLeaderPage.winnerStatus')}</SelectItem>
                                        <SelectItem value="loser">{t('addLeaderPage.loserStatus')}</SelectItem>
                                      </SelectContent>
                                  </Select>
                                   <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`previousElections.${index}.electionYear`}
                              render={({ field }) => (
                                <FormItem className="col-span-6 md:col-span-1">
                                  <FormLabel className="text-xs">{t('addLeaderPage.electionYearLabel')}</FormLabel>
                                  <Input {...field} placeholder="YYYY" />
                                   <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`previousElections.${index}.partyName`}
                              render={({ field }) => (
                                <FormItem className="col-span-10 md:col-span-2">
                                  <FormLabel className="text-xs">{t('addLeaderPage.partyNameLabel')}</FormLabel>
                                  <Input {...field} placeholder="e.g., ABC Party" />
                                   <FormMessage />
                                </FormItem>
                              )}
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="col-span-2 md:col-span-1 self-end"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ electionType: '', constituency: '', status: 'winner', electionYear: '', partyName: '' })}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {t('addLeaderPage.addMoreButton')}
                        </Button>
                      </div>
                    </div>

                    {/* --- Row 4: Files --- */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="photoUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.photoUrlLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.photoUrlPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="manifestoUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.manifestoUrlLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.manifestoUrlPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <Button type="submit" className="w-full py-6 text-lg">
                       {t('addLeaderPage.submitButton')}
                    </Button>
                </form>
            </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(AddLeaderPage);
