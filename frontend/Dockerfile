# Stage 1: Build the Vite React app                                                                  
FROM node:22-bookworm-slim AS builder                                                                
WORKDIR /app                                                                                         
                                                                                                         
# Copy package files and install dependencies                                                        
COPY package*.json ./                                                                                
RUN npm ci                                                                                           
                                                                                                         
# Copy the rest of the frontend code and build it                                                    
COPY . .                                                                                             
RUN npm run build                                                                                    
                                                                                                         
# Stage 2: Serve with Nginx                                                                          
FROM nginx:alpine                                                                                    
                                                                                                         
# Copy the compiled React files from the builder stage to Nginx                                      
COPY --from=builder /app/dist /usr/share/nginx/html    
COPY nginx.conf /etc/nginx/conf.d/default.conf                                              
                                                                                                         
# Expose port 80 for the web server                                                                  
EXPOSE 80                                                                                            
                                                                                                         
# Start Nginx                                                                                        
CMD ["nginx", "-g", "daemon off;"]