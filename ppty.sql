create table properties (
    id bigserial primary key,
    property_id text,
    case_number text,
    sale_date text,
    plaintiff text,
    defendant text,
    property_address text,
    property_type text,
    legal_description text,
    assessed_value text,
    minimum_bid text,
    sale_status text,
    parcel_number text,
    zoning text,
    square_footage text,
    year_built text,
    details_url text, 
    embedding vector (1536)
);

create or replace function search_properties (
    query_embedding vector (1536),
    similarity_threshold float,
    match_count int
) returns table (
    property_id text,
    case_number text,
    sale_date text,
    plaintiff text,
    defendant text,
    property_address text,
    property_type text,
    legal_description text,
    assessed_value text,
    minimum_bid text,
    sale_status text,
    parcel_number text,
    zoning text,
    square_footage text,
    year_built text,
    details_url text, 
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
     properties.id
        properties.property_id,
        properties.case_number,
        properties.sale_date,
        properties.plaintiff,
        properties.defendant,
        properties.property_address,
        properties.property_type,
        properties.legal_description,
        properties.assessed_value,
        properties.minimum_bid,
        properties.sale_status,
        properties.parcel_number,
        properties.zoning,
        properties.square_footage,
        properties.year_built,
        properties.details_url,
        1 - (properties.embedding <=> query_embedding) as similarity
    from properties
    where 1 - (properties.embedding <=> query_embedding) > similarity_threshold
    order by properties.embedding <=> query_embedding 
    limit match_count;
end;
$$;

create index on public.properties
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);