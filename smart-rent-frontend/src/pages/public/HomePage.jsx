import {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {
    Search,
    MapPin,
    Shield,
    Clock,
    Star,
    ArrowRight,
    Users,
    CheckCircle,
    Sparkles,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import PropertyService from '../../services/property.service'
import PropertyCard from '../../components/property/PropertyCard'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import ImagePlaceholder from '../../components/ui/ImagePlaceholder'
import {Stagger, StaggerItem} from '../../components/ui/Stagger'
import RotatingPropertyWatermark from '../../components/home/RotatingPropertyWatermark'

export default function HomePage() {
    const navigate = useNavigate()
    const {isAuthenticated, isLandlord} = useAuth()

    const [searchCity, setSearchCity] = useState('')
    const [featuredProperties, setFeaturedProperties] = useState([])
    const [loadingFeatured, setLoadingFeatured] = useState(true)

    // Load featured properties on mount
    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const result = await PropertyService.search({
                    page: 0,
                    size: 6,
                })
                setFeaturedProperties(result.content || [])
            } catch {
                // Fail silently — homepage still works
                // without featured properties
                setFeaturedProperties([])
            } finally {
                setLoadingFeatured(false)
            }
        }
        loadFeatured()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        navigate(
            `/properties${
                searchCity ? `?city=${encodeURIComponent(searchCity)}` : ''
            }`
        )
    }

    const cities = [
        'Accra',
        'Kumasi',
        'Tamale',
        'Takoradi',
        'Tema',
        'Cape Coast',
    ]

    return (
        <div className="flex flex-col">

            {/* ── HERO ───────────────────────────────
                Composed split layout instead of a
                full-bleed gradient. The right column
                carries a single editorial panel — quiet,
                asymmetric, and intentional. The single
                warm accent (yellow-300) is reserved for
                the eyebrow + price marker.
            ──────────────────────────────────────── */}
            <section className="hero-property relative min-h-[680px]
                                overflow-hidden surface-cream border-b border-gray-100">
                <RotatingPropertyWatermark variant="hero" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                              relative z-10 min-h-[680px] py-16 sm:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12
                                  gap-10 lg:gap-16 items-center min-h-full">

                        {/* Left — headline column */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.32,
                                    ease: [0.0, 0, 0.2, 1],
                                }}>
                                {/* Eyebrow */}
                                <span className="eyebrow-brand">
                                    <Sparkles className="h-3 w-3" />
                                    Verified rentals · Paystack-secured
                                </span>

                                <h1 className="display-editorial mt-5">
                                    A calmer way to
                                    <span className="block">
                                        find your next home.
                                    </span>
                                </h1>

                                <p className="mt-6 text-base sm:text-lg
                                          text-gray-600 max-w-xl
                                          leading-relaxed">
                                    Browse verified rentals across Ghana,
                                    book the dates that work for you, and
                                    pay securely — Mobile Money or card.
                                </p>

                                {/* Search */}
                                <form
                                    onSubmit={handleSearch}
                                    className="mt-8 flex flex-col
                                             sm:flex-row gap-3 max-w-xl">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute
                                                  left-3.5 top-1/2
                                                  -translate-y-1/2
                                                  h-4 w-4
                                                  text-gray-400"/>
                                        <input
                                            type="text"
                                            placeholder="Search by city — Accra, Kumasi…"
                                            value={searchCity}
                                            onChange={(e) =>
                                                setSearchCity(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3
                                                     rounded-btn
                                                     border border-gray-300
                                                     text-sm bg-white
                                                     text-gray-900
                                                     placeholder-gray-400
                                                     transition-colors
                                                     focus:outline-none
                                                     focus:ring-2
                                                     focus:ring-brand-green
                                                     focus:border-transparent"
                                            list="cities"
                                            aria-label="Search city"
                                        />
                                        <datalist id="cities">
                                            {cities.map(city => (
                                                <option key={city} value={city}/>
                                            ))}
                                        </datalist>
                                    </div>

                                    <Button type="submit" size="lg">
                                        <Search className="h-4 w-4"/>
                                        Search
                                    </Button>
                                </form>

                                {/* Quick city list */}
                                <div className="mt-5 flex flex-wrap
                                              items-center gap-x-1 gap-y-1">
                                    <span className="text-meta text-gray-500
                                                 mr-1">
                                        Popular:
                                    </span>
                                    {cities.map((city, i) => (
                                        <button
                                            key={city}
                                            onClick={() =>
                                                navigate(`/properties?city=${city}`)
                                            }
                                            className="text-meta
                                                       text-gray-500
                                                       hover:text-brand-green
                                                       transition-colors">
                                            {city}
                                            {i < cities.length - 1 && (
                                                <span className="mx-1.5
                                                             text-gray-300">
                                                    ·
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right — supporting note layered over the hero visual */}
                        <div className="lg:col-span-5 relative z-20 self-end
                                        pb-2 lg:pb-6">
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.1,
                                    ease: [0.0, 0, 0.2, 1],
                                }}
                                className="hero-property-note w-full min-w-0
                                           lg:ml-auto lg:max-w-xs">
                                <div className="relative">
                                    <p className="eyebrow">
                                        This week
                                    </p>
                                    <p className="mt-3 text-2xl
                                              font-semibold text-gray-900
                                              leading-snug">
                                        Three new listings in East Legon,
                                        verified this morning.
                                    </p>
                                    <p className="mt-2 text-meta text-gray-500">
                                        Updated daily by our verification team.
                                    </p>

                                    {/* Mini stats — different rhythm than
                                        the full stats strip below. */}
                                    <dl className="mt-6 grid grid-cols-2
                                                  gap-x-6 gap-y-4">
                                        {[
                                            { label: 'Avg. response',  value: '< 2 hrs' },
                                            { label: 'Verified today', value: '12' },
                                            { label: 'Cities',          value: '8' },
                                            { label: 'Satisfaction',    value: '99%' },
                                        ].map(({ label, value }) => (
                                            <div key={label}>
                                                <dt className="text-meta
                                                              text-gray-500">
                                                    {label}
                                                </dt>
                                                <dd className="mt-1
                                                              text-card-title
                                                              text-gray-900">
                                                    {value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>

                                    <button
                                        onClick={() => navigate('/properties')}
                                        className="btn-link mt-6
                                                   group">
                                        Browse this week's listings
                                        <ArrowRight className="h-4 w-4
                                                       transition-transform
                                                       group-hover:translate-x-0.5"/>
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ────────────────────────
                Quiet, ink-on-cream band. No icons —
                the numbers speak.
            ──────────────────────────────────────── */}
            <section className="surface-cream border-b border-gray-100/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                              py-10">
                    <Stagger
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        itemDelay={0.04}
                    >
                        {[
                            { value: '2,000+', label: 'Properties listed' },
                            { value: '5,000+', label: 'Happy tenants' },
                            { value: '50+',     label: 'Cities covered' },
                            { value: '99%',     label: 'Satisfaction' },
                        ].map(({ value, label }) => (
                            <StaggerItem key={label}>
                                <div>
                                    <p className="text-3xl sm:text-4xl
                                              font-bold text-gray-900
                                              tracking-tight">
                                        {value}
                                    </p>
                                    <p className="mt-2 text-meta
                                              text-gray-500 uppercase
                                              tracking-wider">
                                        {label}
                                    </p>
                                </div>
                            </StaggerItem>
                        ))}
                    </Stagger>
                </div>
            </section>

            {/* ── FEATURED PROPERTIES ───────────────────── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto
                        px-4 sm:px-6 lg:px-8">

                    <div className="flex items-end
                          justify-between mb-10 gap-4">
                        <div>
                            <span className="eyebrow">
                                Featured
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl
                                       font-bold text-gray-900
                                       tracking-tight">
                                Hand-picked rentals
                            </h2>
                            <p className="text-gray-500 mt-2 max-w-md">
                                A short list, refreshed when
                                new properties go live.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/properties')}
                            className="hidden sm:flex items-center
                                gap-1 text-brand-green
                                hover:text-brand-dark
                                font-medium text-sm
                                transition-colors group">
                            View all
                            <ArrowRight className="h-4 w-4
                                              transition-transform
                                              group-hover:translate-x-0.5"/>
                        </button>
                    </div>

                    {loadingFeatured ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner size="lg"/>
                        </div>
                    ) : featuredProperties.length > 0 ? (
                        <Stagger
                            className="grid grid-cols-1
                                sm:grid-cols-2
                                lg:grid-cols-3 gap-6"
                            itemDelay={0.05}
                        >
                            {featuredProperties.map(property => (
                                <StaggerItem key={property.id}>
                                    <PropertyCard property={property}/>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    ) : (
                        <EmptyState
                            image={<ImagePlaceholder title="No properties yet" type="building" />}
                            title="No properties yet"
                            description="Check back soon for new listings"
                            actionLabel="Browse properties"
                            onAction={() => navigate('/properties')}
                        />
                    )}

                    {/* Mobile view all button */}
                    <div className="sm:hidden mt-8 text-center">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/properties')}
                        >
                            View all properties
                            <ArrowRight className="h-4 w-4"/>
                        </Button>
                    </div>

                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────
                Numbered editorial layout. Step numbers
                are oversized cream-coloured numerals —
                they sit behind the icons rather than
                above them, breaking the centred-icon loop.
            ────────────────────────────────────────────── */}
            <section className="py-20 surface-cream">
                <div className="max-w-7xl mx-auto
                        px-4 sm:px-6 lg:px-8">

                    <div className="mb-14">
                        <span className="eyebrow">
                            How it works
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl
                                   font-bold text-gray-900
                                   tracking-tight max-w-xl">
                            Three steps from search to keys.
                        </h2>
                    </div>

                    <Stagger
                        className="grid grid-cols-1
                          md:grid-cols-3 gap-6"
                        itemDelay={0.08}
                    >
                        {[
                            {
                                step: '01',
                                title: 'Search & browse',
                                description:
                                    'Filter by city, price, bedrooms ' +
                                    'and type. View photos and details ' +
                                    'instantly.',
                                icon: Search,
                            },
                            {
                                step: '02',
                                title: 'Book your dates',
                                description:
                                    'Pick a move-in date and confirm. ' +
                                    'Your booking is held while you pay.',
                                icon: CheckCircle,
                            },
                            {
                                step: '03',
                                title: 'Pay your way',
                                description:
                                    'Mobile Money, debit or credit card ' +
                                    'via Paystack. No hidden fees.',
                                icon: Shield,
                            },
                        ].map(({ step, title, description, icon: Icon }) => (
                            <StaggerItem key={step}>
                                <div className="relative panel-padded
                                              h-full overflow-hidden">
                                    {/* Oversized step numeral */}
                                    <span
                                        aria-hidden="true"
                                        className="absolute
                                                   -top-3 right-4
                                                   text-7xl font-bold
                                                   text-gray-900/[0.04]
                                                   tracking-tighter
                                                   leading-none
                                                   select-none">
                                        {step}
                                    </span>
                                    <div className="relative">
                                        <div className="inline-flex items-center
                                                    justify-center w-10 h-10
                                                    rounded-btn
                                                    bg-white
                                                    border border-gray-200
                                                    mb-5">
                                            <Icon className="h-5 w-5
                                                       text-brand-green"/>
                                        </div>
                                        <h3 className="text-card-title
                                                   text-gray-900 mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-meta text-gray-600
                                                  leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </Stagger>

                </div>
            </section>

            {/* ── WHY SMARTRENT — editorial split ───────
                Replaces the icon-row + CTA stack with
                one editorial left / split right layout.
                Left column carries the rationale, right
                column carries the trust strip.
            ────────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-12
                                  gap-12 lg:gap-16">

                        {/* Left — eyebrow + headline + reason list */}
                        <div className="lg:col-span-7">
                            <span className="eyebrow">
                                Why SmartRent
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl
                                       font-bold text-gray-900
                                       tracking-tight max-w-xl">
                                Built for the way renting
                                <span className="block">
                                    actually works in Ghana.
                                </span>
                            </h2>

                            <div className="mt-10 divide-y divide-gray-100">
                                {[
                                    {
                                        icon: Shield,
                                        title: 'Verified properties',
                                        desc:
                                            'Every listing is reviewed by ' +
                                            'our team before going live. ' +
                                            'No fake photos, no inflated ' +
                                            'availability.',
                                    },
                                    {
                                        icon: Clock,
                                        title: 'Instant booking',
                                        desc:
                                            'Book and get a confirmed ' +
                                            'reference within minutes — ' +
                                            'no waiting on WhatsApp.',
                                    },
                                    {
                                        icon: CheckCircle,
                                        title: 'Secure payments',
                                        desc:
                                            'Powered by Paystack — Ghana\'s ' +
                                            'most trusted payment platform. ' +
                                            'Mobile Money or card.',
                                    },
                                    {
                                        icon: Star,
                                        title: 'Real reviews',
                                        desc:
                                            'Honest reviews from verified ' +
                                            'tenants — never edited, never ' +
                                            'removed.',
                                    },
                                ].map(({ icon: Icon, title, desc }, i) => (
                                    <div
                                        key={title}
                                        className="flex items-start
                                                   gap-5 py-5">
                                        <span className="text-meta
                                                      text-gray-400
                                                      w-6 flex-shrink-0
                                                      pt-1">
                                            0{i + 1}
                                        </span>
                                        <div className="flex-shrink-0
                                                      w-9 h-9
                                                      rounded-btn
                                                      border border-gray-200
                                                      flex items-center
                                                      justify-center">
                                            <Icon className="h-4 w-4
                                                       text-gray-700"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold
                                                       text-gray-900 text-sm">
                                                {title}
                                            </h4>
                                            <p className="text-meta
                                                      text-gray-500 mt-1
                                                      leading-relaxed">
                                                {desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — CTA stack */}
                        <div className="lg:col-span-5 space-y-5">

                            {/* Tenant CTA — primary */}
                            {!isAuthenticated && (
                                <div className="panel-padded
                                                bg-brand-green
                                                text-white
                                                border-0
                                                shadow-card-hover">
                                    <p className="text-meta
                                              uppercase tracking-[0.18em]
                                              text-white/70">
                                        For tenants
                                    </p>
                                    <h3 className="mt-3 text-2xl
                                               font-semibold
                                               leading-snug">
                                        Ready to find your home?
                                    </h3>
                                    <p className="mt-2 text-meta
                                              text-white/80">
                                        Free to register. No listing fees,
                                        no booking fees.
                                    </p>
                                    <Button
                                        onClick={() => navigate('/register')}
                                        className="mt-6 bg-white
                                                   text-brand-green
                                                   hover:bg-gray-100
                                                   focus-visible:ring-white">
                                        Create a free account
                                        <ArrowRight className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}

                            {/* Landlord — coming soon panel */}
                            <div className="panel-padded">
                                <p className="text-meta
                                          uppercase tracking-[0.18em]
                                          text-gray-500">
                                    For landlords
                                </p>
                                <h3 className="mt-3 text-xl
                                           font-semibold text-gray-900">
                                    Own a property?
                                </h3>
                                <p className="mt-2 text-meta
                                          text-gray-500">
                                    Landlord onboarding is invite-only while
                                    we expand the verification team.
                                </p>
                                <p className="mt-5 text-meta text-gray-500">
                                    Email{' '}
                                    <a
                                        href="mailto:support@smartrent.com"
                                        className="text-brand-green
                                                   hover:text-brand-dark
                                                   font-medium">
                                        support@smartrent.com
                                    </a>
                                    {' '}to apply.
                                </p>
                            </div>

                            {/* Already a landlord — show dashboard link */}
                            {isLandlord && (
                                <div className="panel-padded
                                                bg-brand-light
                                                border-brand-green/20">
                                    <h3 className="font-semibold
                                               text-gray-900 mb-1">
                                        Welcome back, Landlord!
                                    </h3>
                                    <p className="text-meta text-gray-500
                                              mb-4">
                                        Manage your properties and view bookings.
                                    </p>
                                    <Button
                                        onClick={() =>
                                            navigate('/landlord/dashboard')}>
                                        Go to dashboard
                                        <ArrowRight className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}

                        </div>

                    </div>

                </div>
            </section>

            {/* ── FINAL CTA ───────────────────────────────
                Quiet ink strip with a single line of copy.
                Single CTA, more breathing room.
            ────────────────────────────────────────────── */}
            {!isAuthenticated && (
                <section className="surface-ink">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6
                                  lg:px-8 py-20">
                        <div className="grid grid-cols-1 md:grid-cols-12
                                      items-end gap-10">
                            <div className="md:col-span-8">
                                <p className="eyebrow text-white/60">
                                    Start your search
                                </p>
                                <h2 className="mt-3 text-3xl sm:text-4xl
                                           font-bold tracking-tight
                                           text-white leading-[1.1]">
                                    Join thousands of Ghanaians
                                    who found their home on SmartRent.
                                </h2>
                                <p className="mt-4 text-meta
                                          text-white/60 max-w-lg">
                                    Free to register. No hidden fees.
                                    Cancel anytime.
                                </p>
                            </div>
                            <div className="md:col-span-4
                                          flex md:justify-end">
                                <Button
                                    onClick={() => navigate('/register')}
                                    size="lg"
                                    className="bg-white
                                               text-gray-900
                                               hover:bg-gray-100
                                               focus-visible:ring-white">
                                    Create free account
                                    <ArrowRight className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

        </div>
    )
}
