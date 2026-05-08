export interface GoogleReview {
  authorAttribution: {
    displayName: string;
  };
  rating: number;
  text: string;
  publishTime: string;
}

export interface PlaceDetails {
  displayName: string;
  formattedAddress: string;
  rating: number;
  reviews: GoogleReview[];
  userRatingCount: number;
}
