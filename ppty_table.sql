create table properties (
    id bigserial primary key,
    title text,
    address text,
    description text,
    image text,
    location text,
    house_type text,
    price text,
    square_footage text,
    lot_size text,
    year_built integer,
    bedrooms text,
    bathrooms text,
    embedding vector (1536)
);

create or replace function search_properties (
    query_embedding vector (1536),
    similarity_threshold float,
    match_count int
) returns table (
    title text,
    address text,
    description text,
    image text,
    location text,
    house_type text,
    price text,
    square_footage text,
    lot_size text,
    year_built integer,
    bedrooms text,
    bathrooms text,
    similarity float
)

language plpgsql
as $$
begin
    return query
    select
        properties.title,
        properties.address,
        properties.description,
        properties.image,
        properties.location,
        properties.house_type,
        properties.price,
        properties.square_footage,
        properties.lot_size,
        properties.year_built,
        properties.bedrooms,
        properties.bathrooms,
        1 - (properties.embedding <=> query_embedding) as similarity
    from properties
    where 1 - (properties.embedding <=> query_embedding) > similarity_threshold
    order by properties.embedding <=> query_embedding 
    limit match_count;
end;
$$;

create index on public.search_properties
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);