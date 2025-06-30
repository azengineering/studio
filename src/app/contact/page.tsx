
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Phone, Twitter, Linkedin, Youtube, Send, Building, Info } from 'lucide-react';

import { getSiteSettings, type SiteSettings } from '@/data/settings';
import { createSupportTicket } from '@/data/support';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const contactFormSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Please enter a valid email.'),
    subject: z.string().min(3, 'Subject must be at least 3 characters.'),
    message: z.string().min(10, 'Message must be at least 10 characters.'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactInfoItem = ({ icon, text, href }: { icon: React.ReactNode, text: string | null, href?: string }) => {
    if (!text) return null;
    const Component = href ? 'a' : 'p';
    return (
        <Component
            href={href}
            target={href ? '_blank' : undefined}
            rel={href ? 'noopener noreferrer' : undefined}
            className="flex items-center gap-4 text-primary transition-colors hover:text-primary/80"
        >
            <span className="flex-shrink-0">{icon}</span>
            <span className="truncate">{text}</span>
        </Component>
    );
};

export default function ContactPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: { name: '', email: '', subject: '', message: '' },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const fetchedSettings = await getSiteSettings();
            setSettings(fetchedSettings);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (user) {
            form.reset({
                ...form.getValues(),
                name: user.name || '',
                email: user.email,
            });
        }
    }, [user, form]);
    
    const onSubmit = async (data: ContactFormData) => {
        try {
            await createSupportTicket({
                user_id: user?.id || null,
                user_name: data.name,
                user_email: data.email,
                subject: data.subject,
                message: data.message,
            });
            toast({
                title: 'Message Sent!',
                description: "Thank you for reaching out. We'll get back to you soon.",
            });
            form.reset({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not send your message. Please try again later.',
            });
        }
    };
    
    const ContactSkeleton = () => (
        <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
        </div>
    );
    
    return (
        <div className="flex flex-col min-h-screen bg-secondary/50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold font-headline">{t('contactPage.title')}</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{t('contactPage.description')}</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('contactPage.formTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('contactPage.nameLabel')}</FormLabel><FormControl><Input {...field} readOnly={!!user} /></FormControl><FormMessage/></FormItem>)}/>
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>{t('contactPage.emailLabel')}</FormLabel><FormControl><Input {...field} readOnly={!!user} /></FormControl><FormMessage/></FormItem>)}/>
                                    </div>
                                    <FormField control={form.control} name="subject" render={({ field }) => (<FormItem><FormLabel>{t('contactPage.subjectLabel')}</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                    <FormField control={form.control} name="message" render={({ field }) => (<FormItem><FormLabel>{t('contactPage.messageLabel')}</FormLabel><FormControl><Textarea {...field} rows={6}/></FormControl><FormMessage/></FormItem>)}/>
                                    <div className="flex justify-end">
                                        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2"/>} {t('contactPage.submitButton')}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    
                    <div className="space-y-8">
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building/> {t('contactPage.infoTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-base">
                                {isLoading ? <ContactSkeleton/> : (
                                    <>
                                        <ContactInfoItem icon={<Mail className="h-5 w-5"/>} text={settings.contact_email} href={`mailto:${settings.contact_email}`}/>
                                        <ContactInfoItem icon={<Phone className="h-5 w-5"/>} text={settings.contact_phone} href={`tel:${settings.contact_phone}`}/>
                                        <ContactInfoItem icon={<Twitter className="h-5 w-5"/>} text={settings.contact_twitter} href={settings.contact_twitter}/>
                                        <ContactInfoItem icon={<Linkedin className="h-5 w-5"/>} text={settings.contact_linkedin} href={settings.contact_linkedin}/>
                                        <ContactInfoItem icon={<Youtube className="h-5 w-5"/>} text={settings.contact_youtube} href={settings.contact_youtube}/>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>{t('contactPage.noteTitle')}</AlertTitle>
                            <AlertDescription>{t('contactPage.noteDescription')}</AlertDescription>
                        </Alert>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
