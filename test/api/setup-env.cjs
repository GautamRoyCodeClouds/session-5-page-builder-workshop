process.env.NODE_ENV = "test";
process.env.PORT = "3101";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://session5:session5@127.0.0.1:54329/session5_test?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
process.env.PUBLISH_DIR = process.env.PUBLISH_DIR || ".data/test-published";
