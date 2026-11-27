-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"restaurant_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "restaurant_categories" (
	"restaurant_id" integer,
	"category_id" integer,
	CONSTRAINT "restaurant_categories_pkey" PRIMARY KEY("restaurant_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "restaurant_external_data" (
	"restaurant_id" serial PRIMARY KEY,
	"google_place_id" text,
	"yelp_id" text,
	"google_data" text,
	"yelp_data" text,
	"last_updated" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"website" text,
	"description" text,
	"rating" double precision,
	"review_count" integer,
	"rating_source" text,
	"tags" text,
	"photos" text,
	"price_level" text,
	"business_status" text,
	"formatted_data_updated" timestamp(3),
	"longitude" double precision,
	"phone" text,
	"opening_hours" text,
	"address" text,
	"latitude" double precision,
	"street_address" text,
	"state" text,
	"city" text,
	"postal_code" text,
	"public_id" text
);
--> statement-breakpoint
CREATE INDEX "idx_category_slug" ON "categories" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "sqlite_autoindex_categories_1" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX "idx_restaurant_categories_category" ON "restaurant_categories" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_restaurant_categories_restaurant" ON "restaurant_categories" ("restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_restaurant_public_id" ON "restaurants" ("public_id");--> statement-breakpoint
CREATE INDEX "idx_restaurant_slug" ON "restaurants" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurants_public_id_key" ON "restaurants" ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sqlite_autoindex_restaurants_1" ON "restaurants" ("slug");--> statement-breakpoint
ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id");--> statement-breakpoint
ALTER TABLE "restaurant_external_data" ADD CONSTRAINT "restaurant_external_data_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id");
*/
