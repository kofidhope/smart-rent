# Watermark assets

The watermark now uses rotating real property photography from Unsplash instead of 
hand-authored SVGs. The previous SVG assets (`house-1.svg` through `house-4.svg`) 
have been retired in favor of dynamically loaded property photography.

Current implementation sources random property photography from Unsplash with the following categories:
- House / residential properties
- Building / architectural shots  
- Apartment / multi-unit dwellings
- Villa / premium properties

All images are sourced from Unsplash and are free to use under the Unsplash license
(https://unsplash.com/license), which permits commercial use without attribution
(though attribution is appreciated where possible).

To customize the property types shown in the watermark:
1. Modify the property type queries in `src/components/home/RotatingHouseWatermark.jsx`
2. Optionally pass a `properties` prop to specify particular property types
3. The component automatically handles fallback to general property searches if specific queries fail
