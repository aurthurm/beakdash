CREATE TABLE IF NOT EXISTS "connections" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(10) NOT NULL,
	"config" jsonb,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "connections_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "datasets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"connection_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"schema" varchar(100),
	"table" varchar(100),
	"columns" jsonb,
	"query" varchar,
	"refresh_interval" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "datasets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"route" varchar(255),
	"icon" varchar(100),
	"active" boolean DEFAULT false,
	"parent_id" varchar,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pages_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "widgets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" varchar(255),
	"layout" jsonb NOT NULL,
	"dataset_id" varchar NOT NULL,
	"transform_config" jsonb NOT NULL,
	"page_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"query" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widgets_title_unique" UNIQUE("title")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "datasets" ADD CONSTRAINT "datasets_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pages" ADD CONSTRAINT "subpage_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "widgets" ADD CONSTRAINT "widgets_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
