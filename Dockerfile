 # Use a lightweight Debian-based Node image that matches your dev environment                        
    FROM node:22-bookworm-slim                                                                           
                                                                                                         
    # Set the working directory inside the container                                                     
    WORKDIR /app                                                                                         
                                                                                                         
    # Copy only package files first (this caches the npm install step)                                   
    COPY package*.json ./                                                                                
                                                                                                         
    # Install production dependencies only (keeps the image small and secure)                            
    RUN npm ci --omit=dev                                                                                
                                                                                                         
    # Copy the rest of the backend source code                                                           
    COPY . .                                                                                             
                                                                                                         
    # Expose the port your Express server runs on                                                        
    EXPOSE 3000                                                                                          
                                                                                                         
   # Start the backend server (Runs migrations first, then starts Express)                              
    CMD ["sh", "-c", "npm run migrate && npm start"] 