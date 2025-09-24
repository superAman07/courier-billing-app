'use client'

import { Phone, Mail, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import React from 'react';

const ThemedButton = ({ children, Icon, onClick, className = '', ...props }:any) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ` +
        `bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 ` +
        className
      }
      aria-label={typeof children === 'string' ? children : 'footer action'}
      {...props}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      <span>{children}</span>
    </button>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden mt-10">
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              AGS Courier
            </h2>
            <p className="text-slate-300 text-base font-medium">Professional courier services worldwide</p>
            <div className="mt-4 flex items-center justify-center md:justify-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-semibold">Available 24/7</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-10">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a 
                href="tel:1-800-AGS-SHIP" 
                className="flex items-center space-x-3 text-slate-300 hover:text-blue-400 transition-all duration-300 group bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Phone className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Call us</div>
                  <span className="text-sm font-semibold">1-800-AGS-SHIP</span>
                </div>
              </a>
              
              <a 
                href="mailto:support@agscourier.com" 
                className="flex items-center space-x-3 text-slate-300 hover:text-purple-400 transition-all duration-300 group bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Mail className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Email</div>
                  <span className="text-sm font-semibold">Contact Us</span>
                </div>
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex space-x-3">
                {[
                  { icon: Facebook, color: "hover:bg-blue-600", bgColor: "bg-blue-500/20" },
                  { icon: Twitter, color: "hover:bg-sky-500", bgColor: "bg-sky-500/20" },
                  { icon: Instagram, color: "hover:bg-pink-600", bgColor: "bg-pink-500/20" },
                  { icon: Linkedin, color: "hover:bg-blue-700", bgColor: "bg-blue-600/20" }
                ].map(({ icon: Icon, color, bgColor }, index) => (
                  <button
                    key={index}
                    aria-label={`open ${Icon.name}`}
                    className={`p-3 rounded-xl ${bgColor} text-white ${color} transition-all duration-300 transform hover:scale-110 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/30 backdrop-blur-sm`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>

              <ThemedButton Icon={ArrowRight} onClick={() => { /* replace with router push or onOpen modal */ }}>
                Get a Quote
              </ThemedButton>
            </div>
          </div>
        </div>

        <div className="border-t border-gradient-to-r from-transparent via-white/20 to-transparent mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">© 2024 AGS Courier. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <a href="#" className="hover:text-blue-400 transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors duration-300">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors duration-300">Support</a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-32 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 to-transparent animate-pulse"></div>
      </div>
    </footer>
  );
};

export default Footer;