export interface Tag {
  id: string;
  name: string;
  color: string; // hex e.g. "#FF5733"
}

export interface CreateTagRequest {
  id?: string;
  name: string;
  color: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}
