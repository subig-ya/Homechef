import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  ArrowRight,
  Star,
  MapPin,
  CalendarCheck,
  Heart,
  Utensils,
  ShieldCheck,
  ChefHat,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState([]);
  const [loadingChefs, setLoadingChefs] = useState(true);

  const reasons = [
    {
      icon: ShieldCheck,
      title: 'Trusted Reviews',
      text: 'See ratings and reviews from people who have actually experienced the food.',
    },
    {
      icon: MapPin,
      title: 'Nearby Chefs',
      text: 'Discover talented chefs and unique dining experiences around your area.',
    },
    {
      icon: CalendarCheck,
      title: 'Easy Booking',
      text: 'Find a chef, choose your experience, and book without complicated steps.',
    },
    {
      icon: Utensils,
      title: 'Variety of Cuisine',
      text: 'Explore everything from traditional favorites to new and exciting flavors.',
    },
  ];

  const handleFindChefs = () => navigate('/chefs');
  const handleChefProfile = (chef) => navigate(`/chefs/${chef._id}`);
  const handleBecomeChef = () => navigate('/become-chef');

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const response = await API.get('/chefs');
        const allChefs = response.data.data || [];
        setChefs(allChefs.slice(0, 4));
      } catch (err) {
        setChefs([]);
      } finally {
        setLoadingChefs(false);
      }
    };

    fetchChefs();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF9F5] text-chocolate">
      <section id="home" className="relative bg-[#FFF9F5]">
        <div className="absolute -left-24 top-24 h-56 w-56 rounded-full bg-[#F8DCE6]/40 blur-3xl" />
        <div className="absolute -right-24 top-16 h-64 w-64 rounded-full bg-[#F3DED4]/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid min-h-[720px] items-center gap-8 py-12 lg:grid-cols-[1fr_0.9fr] lg:py-10">
            <div className="max-w-xl">
              <h1 className="font-cursive text-[3.5rem] leading-[1.03] text-chocolate sm:text-6xl lg:text-[4.9rem]">
                Find a Chef You Love,
                <span className="mt-2 block text-[#B94F73]">
                  Book a Meal You Crave
                </span>
              </h1>

              <p className="mt-8 max-w-lg text-base leading-8 text-[#76534A] sm:text-lg">
                Explore local chefs, discover mouthwatering meals, and book a
                dining experience made just for you.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleFindChefs}
                  className="inline-flex items-center gap-2 rounded-full bg-[#D96F91] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(217,111,145,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C]"
                >
                  Find a Chef
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={handleFindChefs}
                  className="inline-flex items-center rounded-full border border-[#E5C8D1] bg-transparent px-7 py-3.5 text-sm font-semibold text-chocolate transition duration-200 hover:border-[#D96F91] hover:bg-[#FFF0F5]"
                >
                  Explore Chefs
                </button>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative h-[420px] w-[350px] sm:h-[500px] sm:w-[420px]">
                <div className="absolute left-10 top-8 z-0 h-28 w-28 rounded-full bg-[#F5D7E0]" />
                <div className="absolute bottom-14 right-8 z-0 h-32 w-32 rounded-full bg-[#F1DED4]" />

                <img
                  src="/images/chefhead.png"
                  alt="HomeChef chef"
                  className="absolute left-1/2 top-1/2 z-10 h-[430px] w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a HomeChef - only background color changed */}
      <section className="mx-4 mb-12 rounded-[2.5rem] bg-[#B94F73] p-8 text-center text-white sm:p-12">
        <div className="mx-auto max-w-xl space-y-4">
          <h3 className="font-cursive text-3xl">Become a HomeChef</h3>

          <p className="text-xs font-semibold leading-relaxed text-pink-100/80">
            Turn your cooking passion into a home-based business. Join
            instantly and start listing kitchen items, slots, and bookings.
          </p>

          <div className="pt-2">
            <button
              onClick={handleBecomeChef}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-chocolate shadow-md transition-all hover:bg-pink-50 active:scale-95"
            >
              Join our community
              <ArrowRight className="h-4 w-4 text-[#C45B7C]" />
            </button>
          </div>
        </div>
      </section>

      <section id="chefs" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-4xl font-bold tracking-[-0.035em] text-chocolate sm:text-5xl">
                Our Best Chefs
              </h2>
            </div>

            <button
              onClick={handleFindChefs}
              className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#A75D7A] transition hover:text-[#C45B7C]"
            >
              View all chefs
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#76534A]">
            Meet passionate chefs who bring their own style, experience, and
            love of food to every meal.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loadingChefs ? (
              <p className="text-sm text-[#92766E]">
                Loading best chefs...
              </p>
            ) : chefs.length === 0 ? (
              <p className="text-sm text-[#92766E]">
                No chefs available right now.
              </p>
            ) : (
              chefs.map((chef) => (
                <article
                  key={chef._id}
                  className="group overflow-hidden rounded-3xl border border-[#F0DFE4] bg-[#FFFDFB] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(101,58,48,0.09)]"
                >
                  <div className="relative aspect-[4/4.6] overflow-hidden bg-[#FCECEF]">
                    <img
                      src={
                        chef.profileImage ||
                        chef.coverImage ||
                        '/images/chef-placeholder.jpg'
                      }
                      alt={chef.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />

                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                      {chef.averageRating > 0 ? (
                        <>
                          <Star
                            size={13}
                            className="fill-[#E9AE4B] text-[#E9AE4B]"
                          />
                          <span className="text-chocolate">
                            {chef.averageRating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <>
                          <ChefHat
                            size={13}
                            className="text-[#B86A83]"
                          />
                          <span className="text-chocolate">New</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-xl font-semibold text-chocolate">
                      {chef.name}
                    </h3>

                    <p className="mt-1 text-sm text-[#A75D7A]">
                      {chef.specialties?.[0] || 'Various dishes'}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[#92766E]">
                      <MapPin size={13} />
                      {chef.location || 'Home kitchen'}
                    </div>

                    <div className="mt-4 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((number) => (
                        <Star
                          key={number}
                          size={13}
                          className={
                            number <= Math.round(chef.averageRating)
                              ? 'fill-[#E9AE4B] text-[#E9AE4B]'
                              : 'text-[#DCCDC8]'
                          }
                        />
                      ))}

                      <span className="ml-1.5 text-xs text-[#92766E]">
                        {chef.reviewCount} reviews
                      </span>
                    </div>

                    <button
                      onClick={() => handleChefProfile(chef)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#E8CBD5] bg-[#FFF0F5] py-2.5 text-xs font-semibold text-[#A75D7A] transition hover:border-[#D96F91] hover:bg-[#D96F91] hover:text-white"
                    >
                      View Profile
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#FFF4F6] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative">
              <div className="absolute -bottom-5 -left-5 h-28 w-28 rounded-full bg-[#F2D6DE]" />

              <div className="relative overflow-hidden rounded-[2.5rem]">
                <img
                  src="/images/chefaboutus.png"
                  alt="Chef preparing food"
                  className="h-[420px] w-full object-cover mix-blend-multiply sm:h-[520px]"
                />
              </div>
            </div>

            <div className="max-w-xl">
              <h2 className="font-serif text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-chocolate sm:text-5xl">
                Good Food Starts
                <span className="block text-[#C45B7C]">
                  With Great Chefs
                </span>
              </h2>

              <p className="mt-7 text-sm leading-8 text-[#76534A] sm:text-base">
                HomeChef brings people and passionate chefs together over the
                love of good food. Whether you're craving a homemade favorite,
                planning a gathering, or simply looking for something new to
                taste, HomeChef helps you find the right chef for the occasion.
              </p>

              <p className="mt-5 text-sm leading-8 text-[#76534A] sm:text-base">
                Discover talented chefs, explore their specialties, choose
                what you love, and book with ease. For chefs, it's a place to
                showcase their skills, share their food, and connect with people
                who appreciate it.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#D96F91] shadow-sm">
                  <Heart size={18} className="fill-[#F4B3C8]" />
                </div>

                <p className="font-cursive text-xl text-[#A75D7A]">
                  Find your chef. Follow your cravings.
                </p>
              </div>

              <button
                onClick={handleFindChefs}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D96F91] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#C45B7C]"
              >
                Discover Chefs
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="why-us" className="bg-[#FFF9F5] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-bold tracking-[-0.035em] text-chocolate sm:text-5xl">
              Why Choose Us?
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#76534A] sm:text-base">
              We make it easier to discover talented chefs, find food you love,
              and book a dining experience that feels personal.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => {
              const Icon = reason.icon;

              return (
                <div
                  key={reason.title}
                  className="group rounded-2xl border border-[#EEDFE3] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#E7C7D1] hover:shadow-[0_15px_35px_rgba(101,58,48,0.07)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCE3EC] text-[#C45B7C] transition duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-chocolate">
                    {reason.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#76534A]">
                    {reason.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl rounded-4xl bg-[#FFF2F5] px-6 py-16 text-center sm:px-12">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#B86A83]">
            YOUR NEXT MEAL STARTS HERE
          </p>

          <h2 className="mt-4 font-serif text-4xl font-bold tracking-[-0.035em] text-chocolate sm:text-5xl">
            Ready to Find Your Chef?
          </h2>

          <p className="mt-3 font-cursive text-xl text-[#C45B7C]">
            Your next delicious story starts here ✦
          </p>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#76534A] sm:text-base">
            Explore local chefs, discover something delicious, and book a
            dining experience made around what you love.
          </p>

          <button
            onClick={handleFindChefs}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D96F91] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(217,111,145,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C]"
          >
            Explore Chefs
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
};

export default Home;