export interface File {
  path: string;
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export interface Photo {
  name: string;
}

export interface Category {
  name: string;
  path: string;
  photos: Photo[];
}
