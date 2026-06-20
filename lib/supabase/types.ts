export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DestinationStatus = "draft" | "published";
export type EnquiryStatus = "new" | "contacted" | "closed";
export type BookingStatus =
  | "new"
  | "confirmed"
  | "awaiting_payment"
  | "paid"
  | "cancelled";
export type PaymentStatus =
  | "initiated"
  | "pending"
  | "captured"
  | "failed"
  | "refunded";
export type CustomInquiryType =
  | "package"
  | "hotel"
  | "airticket"
  | "transport";

export type Database = {
  public: {
    Tables: {
      destinations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          title: string;
          tagline: string;
          key_attraction: string;
          summary: string;
          best_for: string;
          highlights: string[];
          hero_image: string;
          card_image: string;
          status: DestinationStatus;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["destinations"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["destinations"]["Row"],
            "slug" | "title" | "tagline" | "summary"
          >;
        Update: Partial<Database["public"]["Tables"]["destinations"]["Row"]>;
      };
      tour_packages: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          title: string;
          tier: string;
          hotels: string;
          destinations_summary: string;
          duration: string;
          image: string;
          summary: string;
          inclusions: string[];
          price_amount: number | null;
          currency: string;
          deposit_amount: number | null;
          status: DestinationStatus;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["tour_packages"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["tour_packages"]["Row"],
            "slug" | "title" | "tier" | "hotels" | "destinations_summary" | "duration" | "summary"
          >;
        Update: Partial<Database["public"]["Tables"]["tour_packages"]["Row"]>;
      };
      itinerary_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          tour_package_id: string;
          day_label: string;
          title: string;
          description: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["itinerary_items"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["itinerary_items"]["Row"],
            "tour_package_id" | "day_label" | "title" | "description"
          >;
        Update: Partial<Database["public"]["Tables"]["itinerary_items"]["Row"]>;
      };
      enquiries: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string;
          phone: string | null;
          package_label: string | null;
          message: string;
          status: EnquiryStatus;
          source: string;
          ip_hash: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["enquiries"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["enquiries"]["Row"],
            "name" | "email" | "message"
          >;
        Update: Partial<Database["public"]["Tables"]["enquiries"]["Row"]>;
      };
      bookings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          reference: string;
          tour_package_id: string;
          traveller_name: string;
          email: string;
          phone: string | null;
          travel_dates: string;
          travellers: number;
          notes: string | null;
          status: BookingStatus;
          quoted_amount: number | null;
          currency: string;
          ip_hash: string | null;
          user_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["bookings"]["Row"],
            | "reference"
            | "tour_package_id"
            | "traveller_name"
            | "email"
            | "travel_dates"
            | "travellers"
          >;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          booking_id: string;
          mpgs_order_id: string;
          mpgs_session_id: string | null;
          mpgs_transaction_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          pay_token: string;
          pay_token_expires_at: string;
          gateway_result: Json | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["payments"]["Row"],
            "booking_id" | "mpgs_order_id" | "amount" | "currency" | "pay_token" | "pay_token_expires_at"
          >;
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      custom_inquiries: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          inquiry_type: CustomInquiryType;
          first_name: string;
          last_name: string;
          country_city: string | null;
          passport_number: string | null;
          email: string;
          mobile: string;
          details: Json;
          status: EnquiryStatus;
          ip_hash: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["custom_inquiries"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["custom_inquiries"]["Row"],
            "inquiry_type" | "first_name" | "last_name" | "email" | "mobile"
          >;
        Update: Partial<Database["public"]["Tables"]["custom_inquiries"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string;
          email: string;
          phone: string | null;
          verified: boolean;
          verified_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["customers"]["Row"],
            "id" | "full_name" | "email"
          >;
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          role: "admin";
          full_name: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> &
          Pick<Database["public"]["Tables"]["profiles"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      site_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          key: string;
          value: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]> &
          Pick<Database["public"]["Tables"]["site_settings"]["Row"], "key" | "value">;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      content_status: DestinationStatus;
      enquiry_status: EnquiryStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      custom_inquiry_type: CustomInquiryType;
      staff_role: "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
