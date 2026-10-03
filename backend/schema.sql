
CREATE TABLE  IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL
);

INSERT INTO expenses (title, amount, category, date) VALUES
('Lunch', 4.50, 'Food', '2026-01-15'),
('Bus Ticket', 1.20, 'Transport', '2026-01-16'),
('Internet Bill', 25.00, 'Bills', '2026-01-17');