import {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {Search, MapPin, Shield, Clock, Star, ArrowRight, Building2, Users, CheckCircle, ChevronDown,} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import PropertyService from '../../services/property.service'
import PropertyCard from '../../components/property/PropertyCard'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

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
        navigate(`/properties${searchCity ? `?city=${encodeURIComponent(searchCity)}` : ''}`
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

            {/* ── HERO SECTION ──────────────────────────── */}
            <section
                className="relative bg-gradient-to-br from-brand-green via-brand-dark to-gray-900 text-white overflow-hidden">

                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"/>
                    <div
                        className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2"/>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">

                    <div className="max-w-3xl">

                        {/* Tag line */}
                        <div
                            className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 backdrop-blur-sm">
                            <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300"/>
                            <span>Ghana's trusted rental platform</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            Find your perfect
                            <span className="block text-yellow-300">
                  home in Ghana
                </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
                            Browse thousands of verified rental
                            properties across Ghana. Secure booking,
                            easy payments via Mobile Money and cards.
                        </p>

                        {/* Search bar */}
                        <form
                            onSubmit={handleSearch}
                            className="flex flex-col sm:flex-row gap-3 max-w-2xl"
                        >
                            <div className="relative flex-1">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input
                                    type="text"
                                    placeholder="Search by city — Accra, Kumasi..."
                                    value={searchCity}
                                    onChange={(e) => setSearchCity(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4
                             rounded-xl text-gray-900
                             text-sm bg-white
                             focus:outline-none
                             focus:ring-2
                             focus:ring-yellow-300
                             shadow-lg"
                                    list="cities"
                                />
                                <datalist id="cities">
                                    {cities.map(city => (<option key={city} value={city}/>))}
                                </datalist>
                            </div>

                            <button
                                type="submit"
                                className="flex items-center
                           justify-center gap-2
                           bg-yellow-400 hover:bg-yellow-300
                           text-gray-900 font-semibold
                           px-8 py-4 rounded-xl
                           transition-colors duration-200
                           shadow-lg"
                            >
                                <Search className="h-5 w-5"/>
                                Search
                            </button>
                        </form>

                        {/* Quick city links */}
                        <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-white/60 text-sm self-center">
                  Popular:
                </span>
                            {cities.map(city => (
                                <button
                                    key={city}
                                    onClick={() =>
                                        navigate(`/properties?city=${city}`)
                                    }
                                    className="text-sm text-white/80
                             hover:text-white
                             underline underline-offset-2
                             transition-colors"
                                >
                                    {city}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
                    <ChevronDown className="h-6 w-6 text-white/50"/>
                </div>
            </section>

            {/* ── STATS SECTION ─────────────────────────── */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            {
                                value: '2,000+',
                                label: 'Properties listed',
                                icon: Building2,
                            },
                            {
                                value: '5,000+',
                                label: 'Happy tenants',
                                icon: Users,
                            },
                            {
                                value: '50+',
                                label: 'Cities covered',
                                icon: MapPin,
                            },
                            {
                                value: '99%',
                                label: 'Satisfaction rate',
                                icon: Star,
                            },
                        ].map(({value, label, icon: Icon}) => (
                            <div key={label} className="text-center">
                                <div
                                    className="inline-flex items-center justify-center w-12 h-12 bg-brand-light rounded-xl mb-3">
                                    <Icon className="h-6 w-6 text-brand-green"/>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {value}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED PROPERTIES ───────────────────── */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto
                        px-4 sm:px-6 lg:px-8">

                    <div className="flex items-end
                          justify-between mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Featured properties
                            </h2>
                            <p className="text-gray-500 mt-1">
                                Hand-picked rentals across Ghana
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/properties')}
                            className="hidden sm:flex items-center
                         gap-1 text-brand-green
                         hover:text-brand-dark
                         font-medium text-sm
                         transition-colors"
                        >
                            View all
                            <ArrowRight className="h-4 w-4"/>
                        </button>
                    </div>

                    {loadingFeatured ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner size="lg"/>
                        </div>
                    ) : featuredProperties.length > 0 ? (
                        <div className="grid grid-cols-1
                            sm:grid-cols-2
                            lg:grid-cols-3 gap-6">
                            {featuredProperties.map(property => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Building2 className="h-12 w-12
                                    text-gray-300
                                    mx-auto mb-3"/>
                            <p className="text-gray-500">
                                No properties yet.
                                Check back soon.
                            </p>
                        </div>
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

            {/* ── HOW IT WORKS ──────────────────────────── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto
                        px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl
                           font-bold text-gray-900">
                            How SmartRent works
                        </h2>
                        <p className="text-gray-500 mt-2 max-w-xl
                          mx-auto">
                            Renting a home in Ghana has never been
                            this simple
                        </p>
                    </div>

                    <div className="grid grid-cols-1
                          md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Search and browse',
                                description:
                                    'Filter by city, price, bedrooms ' +
                                    'and property type. View photos ' +
                                    'and details instantly.',
                                icon: Search,
                                color: 'bg-blue-50 text-blue-600',
                            },
                            {
                                step: '02',
                                title: 'Book securely',
                                description:
                                    'Select your dates and book ' +
                                    'online. Your booking is confirmed ' +
                                    'instantly after payment.',
                                icon: CheckCircle,
                                color: 'bg-green-50 text-green-600',
                            },
                            {
                                step: '03',
                                title: 'Pay with ease',
                                description:
                                    'Pay securely via Mobile Money, ' +
                                    'debit or credit card through ' +
                                    'Paystack. No hidden fees.',
                                icon: Shield,
                                color: 'bg-purple-50 text-purple-600',
                            },
                        ].map(({
                                   step,
                                   title,
                                   description,
                                   icon: Icon,
                                   color,
                               }) => (
                            <div
                                key={step}
                                className="relative text-center
                           p-6"
                            >
                                {/* Step number */}
                                <div className="text-6xl font-black
                                text-gray-100 mb-4
                                leading-none">
                                    {step}
                                </div>

                                {/* Icon */}
                                <div className={`
                  inline-flex items-center
                  justify-center w-14 h-14
                  rounded-2xl mb-4 -mt-8
                  ${color}
                `}>
                                    <Icon className="h-7 w-7"/>
                                </div>

                                <h3 className="text-lg font-semibold
                               text-gray-900 mb-2">
                                    {title}
                                </h3>
                                <p className="text-gray-500 text-sm
                              leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ── WHY SMARTRENT ─────────────────────────── */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left — text */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                                Why thousands choose SmartRent
                            </h2>

                            <div className="space-y-4">
                                {[
                                    {
                                        icon: Shield,
                                        title: 'Verified properties',
                                        desc:
                                            'Every listing is verified by ' +
                                            'our team before going live.',
                                    },
                                    {
                                        icon: Clock,
                                        title: 'Instant booking',
                                        desc:
                                            'Book and get confirmed in ' +
                                            'minutes — no waiting.',
                                    },
                                    {
                                        icon: CheckCircle,
                                        title: 'Secure payments',
                                        desc:
                                            'Powered by Paystack — Ghana\'s ' +
                                            'most trusted payment platform.',
                                    },
                                    {
                                        icon: Star,
                                        title: 'Real reviews',
                                        desc:
                                            'Read honest reviews from ' +
                                            'verified tenants.',
                                    },
                                ].map(({icon: Icon, title, desc}) => (
                                    <div key={title} className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-brand-green"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                {title}
                                            </h4>
                                            <p className="text-gray-500 text-sm mt-0.5">
                                                {desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — CTA cards */}
                        <div className="space-y-4">

                            {/* Tenant CTA */}
                            {!isAuthenticated && (
                                <div className="card bg-gradient-to-r from-brand-green to-brand-dark text-white border-0">
                                    <h3 className="text-lg font-bold mb-2">
                                        Ready to find your home?
                                    </h3>
                                    <p className="text-white/80 text-sm mb-4">
                                        Create a free account and start
                                        browsing thousands of properties.
                                    </p>
                                    <Button
                                        onClick={() => navigate('/register')}
                                        className="bg-white text-brand-green hover:bg-gray-100 focus:ring-white" >
                                            Get started free
                                        <ArrowRight className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}

                            {/* ── BECOME A LANDLORD ────────────────
                  Placeholder for future landlord
                  onboarding flow.
                  When implemented this will:
                  1. Take user to a landlord application form
                  2. They upload property documents
                  3. Admin reviews and approves
                  4. Role is promoted to LANDLORD
                  ──────────────────────────────────── */}
                            <div className="card border-2 border-dashed border-brand-green/40 bg-brand-light/30">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Building2 className="h-5 w-5 text-brand-green"/>
                                            <h3 className="font-bold text-gray-900">
                                                Own a property?
                                            </h3>
                                        </div>
                                        <p className="text-gray-500
                                  text-sm mb-4">
                                            List your property on SmartRent
                                            and reach thousands of tenants
                                            across Ghana.
                                        </p>
                                        <Button
                                            variant="secondary"
                                            disabled
                                            title="Coming soon — contact support@smartrent.com"
                                            className="opacity-70"
                                        >
                                            Become a landlord
                                            <span className="ml-2 badge-yellow
                                       text-xs px-1.5
                                       py-0.5 rounded-full">
                        Coming soon
                      </span>
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mt-4">
                                    Currently becoming a landlord requires admin approval. Email{' '}
                                    <a
                                        href="mailto:support@smartrent.com"
                                        className="text-brand-green hover:underline"
                                    >
                                        support@smartrent.com
                                    </a>{' '}
                                    to get started.
                                </p>
                        </div>

                        {/* Already a landlord — show dashboard link */}
                        {isLandlord && (
                            <div className="card bg-brand-light
                                border-brand-green/20">
                                <h3 className="font-semibold
                                 text-gray-900 mb-1">
                                    Welcome back, Landlord!
                                </h3>
                                <p className="text-gray-500
                                text-sm mb-3">
                                    Manage your properties and
                                    view bookings.
                                </p>
                                <Button
                                    onClick={() =>
                                        navigate('/landlord/dashboard')
                                    }
                                >
                                    Go to dashboard
                                    <ArrowRight className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}

                    </div>

                </div>
        </div>
</section>

    {/* ── FINAL CTA ─────────────────────────────── */
    }
    {
        !isAuthenticated && (
            <section className="py-16 bg-gray-900 text-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        Start your search today
                    </h2>
                    <p className="text-gray-400 mb-8 text-sm sm:text-base">
                        Join thousands of Ghanaians who found
                        their home on SmartRent.
                        Free to register, no hidden fees.
                    </p>
                    <div className="flex flex-col
                            sm:flex-row gap-3
                            justify-center">
                        <Button
                            onClick={() => navigate('/register')}
                            className="bg-brand-green
                           hover:bg-brand-dark
                           focus:ring-brand-green
                           text-white"
                            size="lg"
                        >
                            Create free account
                            <ArrowRight className="h-5 w-5"/>
                        </Button>
                        <Button
                            onClick={() => navigate('/properties')}
                            variant="secondary"
                            size="lg"
                            className="bg-white/10 border-white/20
                           text-white hover:bg-white/20"
                        >
                            Browse properties
                        </Button>
                    </div>
                </div>
            </section>
        )
    }

</div>
)
}